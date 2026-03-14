"""
Billing Routes
Stripe checkout, portal, webhook, and usage/status endpoints.
"""

import os
import logging
import stripe
from flask import Blueprint, request, jsonify
from backend.middleware.auth import auth_required, get_current_user
from backend.storage import user_storage
from backend.billing.plans import PLANS, get_plan
from backend.billing.usage import get_all_usage

logger = logging.getLogger(__name__)
billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')

# Stripe config — read at request time so tests can override
def _stripe_key():
    return os.getenv('STRIPE_SECRET_KEY', '')

def _webhook_secret():
    return os.getenv('STRIPE_WEBHOOK_SECRET', '')

def _pro_price_id():
    return os.getenv('STRIPE_PRO_PRICE_ID', '')

def _app_url():
    return os.getenv('APP_URL', 'http://localhost:3001')


@billing_bp.route('/plans', methods=['GET'])
def list_plans():
    """Return available plans and their features."""
    plans = []
    for key, plan in PLANS.items():
        plans.append({
            'id': key,
            'name': plan['name'],
            'displayName': plan['display_name'],
            'priceMonthly': plan['price_monthly'],
            'features': plan['features'],
            'limits': plan['limits'],
        })
    return jsonify({'plans': plans})


@billing_bp.route('/status', methods=['GET'])
@auth_required
def billing_status():
    """Get current user's plan, usage, and subscription info."""
    user = get_current_user()
    plan_name = user.get('plan', 'free')
    plan = get_plan(plan_name)
    usage = get_all_usage(user['id'], plan_name)

    # Count active trackings
    from backend.storage import tracking_storage
    trackings = tracking_storage.get_by_user(user['id'])
    active_count = sum(1 for t in trackings if t.get('is_active', False))

    return jsonify({
        'plan': plan_name,
        'displayName': plan['display_name'],
        'priceMonthly': plan['price_monthly'],
        'features': plan['features'],
        'usage': usage,
        'activeTrackings': {
            'used': active_count,
            'limit': plan['limits']['active_trackings'],
        },
        'stripeCustomerId': _get_user_field(user['id'], 'stripe_customer_id'),
        'subscriptionStatus': _get_user_field(user['id'], 'subscription_status'),
    })


@billing_bp.route('/checkout', methods=['POST'])
@auth_required
def create_checkout():
    """Create a Stripe Checkout session for Pro plan."""
    user = get_current_user()
    secret_key = _stripe_key()

    if not secret_key:
        return jsonify({'error': {'code': 'BILLING_NOT_CONFIGURED', 'message': 'Stripe is not configured'}}), 503

    stripe.api_key = secret_key
    price_id = _pro_price_id()

    if not price_id:
        return jsonify({'error': {'code': 'BILLING_NOT_CONFIGURED', 'message': 'Pro price ID not configured'}}), 503

    # Get or create Stripe customer
    full_user = user_storage.get(user['id'])
    customer_id = full_user.get('stripe_customer_id')

    try:
        if not customer_id:
            customer = stripe.Customer.create(
                email=user['email'],
                name=user.get('name', ''),
                metadata={'burilar_user_id': user['id']},
            )
            customer_id = customer.id
            user_storage.update(user['id'], {'stripe_customer_id': customer_id})

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{_app_url()}/?billing=success",
            cancel_url=f"{_app_url()}/?billing=cancel",
            metadata={'burilar_user_id': user['id']},
        )

        return jsonify({'url': session.url})

    except stripe.error.StripeError as e:
        logger.error('Stripe checkout error: %s', e)
        return jsonify({'error': {'code': 'STRIPE_ERROR', 'message': str(e)}}), 500


@billing_bp.route('/portal', methods=['POST'])
@auth_required
def create_portal():
    """Create a Stripe Billing Portal session for managing subscription."""
    user = get_current_user()
    secret_key = _stripe_key()

    if not secret_key:
        return jsonify({'error': {'code': 'BILLING_NOT_CONFIGURED', 'message': 'Stripe is not configured'}}), 503

    stripe.api_key = secret_key
    full_user = user_storage.get(user['id'])
    customer_id = full_user.get('stripe_customer_id')

    if not customer_id:
        return jsonify({'error': {'code': 'NO_SUBSCRIPTION', 'message': 'サブスクリプションが見つかりません'}}), 400

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{_app_url()}/",
        )
        return jsonify({'url': session.url})

    except stripe.error.StripeError as e:
        logger.error('Stripe portal error: %s', e)
        return jsonify({'error': {'code': 'STRIPE_ERROR', 'message': str(e)}}), 500


@billing_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events."""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    secret_key = _stripe_key()
    webhook_secret = _webhook_secret()

    if not secret_key or not webhook_secret:
        return jsonify({'error': 'Webhooks not configured'}), 503

    stripe.api_key = secret_key

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        logger.warning('Invalid webhook payload')
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        logger.warning('Invalid webhook signature')
        return jsonify({'error': 'Invalid signature'}), 400

    event_type = event['type']
    data = event['data']['object']
    logger.info('Stripe webhook: %s', event_type)

    if event_type == 'checkout.session.completed':
        _handle_checkout_completed(data)
    elif event_type == 'customer.subscription.updated':
        _handle_subscription_updated(data)
    elif event_type == 'customer.subscription.deleted':
        _handle_subscription_deleted(data)
    elif event_type == 'invoice.payment_failed':
        _handle_payment_failed(data)

    return jsonify({'received': True})


def _handle_checkout_completed(session):
    """Upgrade user to pro after successful checkout."""
    user_id = session.get('metadata', {}).get('burilar_user_id')
    if not user_id:
        # Try to find by customer_id
        customer_id = session.get('customer')
        user = _find_user_by_customer_id(customer_id)
        if user:
            user_id = user['id']

    if user_id:
        user_storage.update(user_id, {
            'plan': 'pro',
            'subscription_status': 'active',
            'stripe_subscription_id': session.get('subscription'),
        })
        logger.info('User %s upgraded to pro', user_id)


def _handle_subscription_updated(subscription):
    """Handle subscription status changes (e.g. past_due)."""
    customer_id = subscription.get('customer')
    user = _find_user_by_customer_id(customer_id)
    if not user:
        return

    status = subscription.get('status')
    update_data = {'subscription_status': status}

    if status in ('active', 'trialing'):
        update_data['plan'] = 'pro'
    elif status in ('past_due', 'unpaid'):
        update_data['plan'] = 'pro'  # Keep pro but flag status

    user_storage.update(user['id'], update_data)
    logger.info('Subscription updated for user %s: status=%s', user['id'], status)


def _handle_subscription_deleted(subscription):
    """Downgrade user to free when subscription is cancelled."""
    customer_id = subscription.get('customer')
    user = _find_user_by_customer_id(customer_id)
    if not user:
        return

    user_storage.update(user['id'], {
        'plan': 'free',
        'subscription_status': 'cancelled',
        'stripe_subscription_id': None,
    })
    logger.info('User %s downgraded to free (subscription cancelled)', user['id'])


def _handle_payment_failed(invoice):
    """Log payment failure."""
    customer_id = invoice.get('customer')
    user = _find_user_by_customer_id(customer_id)
    if user:
        logger.warning('Payment failed for user %s', user['id'])


def _find_user_by_customer_id(customer_id: str):
    """Find a user by their Stripe customer ID."""
    if not customer_id:
        return None
    users = user_storage.query({'stripe_customer_id': customer_id})
    return users[0] if users else None


def _get_user_field(user_id: str, field: str):
    """Get a specific field from user storage."""
    user = user_storage.get(user_id)
    return user.get(field) if user else None
