"""
Input Validation Schemas
Validates and sanitizes all API request bodies.
"""

import re
from functools import wraps
from flask import request, jsonify


class ValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__(str(errors))


def validate_request(schema):
    """Decorator that validates request.json against a schema dict.

    Schema format:
        {
            'field_name': {
                'type': str/int/bool/list/dict,
                'required': True/False,
                'max_length': 1000,
                'min_length': 1,
                'choices': ['a', 'b'],
                'pattern': r'regex',
                'default': value,
                'data_key': 'camelCaseKey',  # key in request JSON
            }
        }
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            data = request.json or {}
            errors = {}
            cleaned = {}

            for field, rules in schema.items():
                data_key = rules.get('data_key', field)
                value = data.get(data_key)

                # Default
                if value is None and 'default' in rules:
                    value = rules['default']

                # Required check
                if rules.get('required') and (value is None or (isinstance(value, str) and not value.strip())):
                    errors[field] = 'This field is required'
                    continue

                # Skip optional empty
                if value is None:
                    cleaned[field] = None
                    continue

                # Type check
                expected_type = rules.get('type')
                if expected_type and not isinstance(value, expected_type):
                    errors[field] = f'Expected {expected_type.__name__}'
                    continue

                # String validations
                if isinstance(value, str):
                    value = value.strip()
                    max_len = rules.get('max_length')
                    min_len = rules.get('min_length')
                    if max_len and len(value) > max_len:
                        errors[field] = f'Maximum {max_len} characters'
                        continue
                    if min_len and len(value) < min_len:
                        errors[field] = f'Minimum {min_len} characters'
                        continue
                    pattern = rules.get('pattern')
                    if pattern and not re.match(pattern, value):
                        errors[field] = 'Invalid format'
                        continue

                # Choices
                if 'choices' in rules and value not in rules['choices']:
                    errors[field] = f'Must be one of: {", ".join(str(c) for c in rules["choices"])}'
                    continue

                cleaned[field] = value

            if errors:
                return jsonify({
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': next(iter(errors.values())),
                        'details': errors,
                    }
                }), 400

            # Attach cleaned data to request
            request.validated = cleaned
            return f(*args, **kwargs)

        return decorated
    return decorator


# ── Shared schemas ─────────────────────────────────────────────────────────────

EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

REGISTER_SCHEMA = {
    'email': {'type': str, 'required': True, 'max_length': 254, 'pattern': EMAIL_PATTERN},
    'password': {'type': str, 'required': True, 'min_length': 6, 'max_length': 128},
    'name': {'type': str, 'required': True, 'min_length': 1, 'max_length': 100},
}

LOGIN_SCHEMA = {
    'email': {'type': str, 'required': True, 'pattern': EMAIL_PATTERN},
    'password': {'type': str, 'required': True},
}

SEARCH_SCHEMA = {
    'query': {'type': str, 'required': True, 'min_length': 1, 'max_length': 1000},
    'chatHistory': {'type': list, 'required': False, 'data_key': 'chatHistory'},
}

CREATE_TRACKING_SCHEMA = {
    'query': {'type': str, 'required': True, 'min_length': 1, 'max_length': 1000},
    'searchResult': {'type': str, 'required': False, 'data_key': 'searchResult'},
    'frequency': {
        'type': str, 'required': False, 'default': 'daily',
        'choices': ['realtime', 'hourly', 'daily', 'weekly', 'custom'],
    },
    'customFrequencyHours': {'type': int, 'required': False, 'data_key': 'customFrequencyHours'},
    'notificationEnabled': {'type': bool, 'required': False, 'default': True, 'data_key': 'notificationEnabled'},
}

UPDATE_TRACKING_SCHEMA = {
    'isActive': {'type': bool, 'required': False, 'data_key': 'isActive'},
    'isPinned': {'type': bool, 'required': False, 'data_key': 'isPinned'},
    'frequency': {
        'type': str, 'required': False,
        'choices': ['realtime', 'hourly', 'daily', 'weekly', 'custom'],
    },
    'customFrequencyHours': {'type': int, 'required': False, 'data_key': 'customFrequencyHours'},
    'notificationEnabled': {'type': bool, 'required': False, 'data_key': 'notificationEnabled'},
    'title': {'type': str, 'required': False, 'max_length': 200},
    'description': {'type': str, 'required': False, 'max_length': 2000},
    'emailEnabled': {'type': bool, 'required': False, 'data_key': 'emailEnabled'},
    'pushEnabled': {'type': bool, 'required': False, 'data_key': 'pushEnabled'},
    'detailLevel': {
        'type': str, 'required': False, 'data_key': 'detailLevel',
        'choices': ['summary', 'normal', 'detailed'],
    },
    'sources': {'type': list, 'required': False},
}

CREATE_MESSAGE_SCHEMA = {
    'content': {'type': str, 'required': True, 'min_length': 1, 'max_length': 5000},
    'role': {'type': str, 'required': False, 'default': 'user', 'choices': ['user', 'assistant']},
    'id': {'type': str, 'required': False},
    'timestamp': {'type': str, 'required': False},
    'sources': {'required': False},
    'images': {'required': False},
}

FEEDBACK_SCHEMA = {
    'feedback': {'type': str, 'required': True, 'choices': ['useful', 'not_useful']},
}
