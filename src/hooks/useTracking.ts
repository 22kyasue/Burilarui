import { useState, useRef, useEffect } from "react";

interface TrackingSuggestion {
    messageId: string;
    query: string;
    accepted: boolean;
    suggestedPrompt?: string;
    imageUrl?: string;
}

export function useTracking() {
    const [trackingSuggestions, setTrackingSuggestions] = useState<
        Array<TrackingSuggestion>
    >([
        {
            messageId: "ai-m1",
            query: "Apple Intelligenceの2024〜2025年の動向についてキャッチアップしたい。最新の動向を教えてください。",
            accepted: false,
        },
    ]);

    const [activeTracking, setActiveTracking] = useState<{
        theme: string;
        frequency: string;
        startTime?: Date;
    } | null>(null);

    const [isTrackingDetailOpen, setIsTrackingDetailOpen] = useState(false);
    const [isDefaultModeDetailOpen, setIsDefaultModeDetailOpen] = useState(false);

    // SimpleTrackingSetup and Detail switching state
    const [showSimpleTrackingSetup, setShowSimpleTrackingSetup] = useState(false);
    const [showDetailSettings, setShowDetailSettings] = useState(false);

    // Refs
    const trackingSuggestionCardRef = useRef<HTMLDivElement>(null);
    const trackingStatusBadgeRef = useRef<HTMLDivElement>(null);

    // Scroll effect for tracking badge
    useEffect(() => {
        if (
            !isTrackingDetailOpen &&
            !isDefaultModeDetailOpen &&
            trackingStatusBadgeRef.current
        ) {
            setTimeout(() => {
                trackingStatusBadgeRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 100); // Scroll after panel close animation
        }
    }, [isTrackingDetailOpen, isDefaultModeDetailOpen]);

    const addTrackingSuggestion = (suggestion: TrackingSuggestion) => {
        setTrackingSuggestions((prev) => [...prev, suggestion]);
    };

    return {
        trackingSuggestions,
        setTrackingSuggestions,
        addTrackingSuggestion,
        activeTracking,
        setActiveTracking,
        isTrackingDetailOpen,
        setIsTrackingDetailOpen,
        isDefaultModeDetailOpen,
        setIsDefaultModeDetailOpen,
        showSimpleTrackingSetup,
        setShowSimpleTrackingSetup,
        showDetailSettings,
        setShowDetailSettings,
        trackingSuggestionCardRef,
        trackingStatusBadgeRef,
    };
}
