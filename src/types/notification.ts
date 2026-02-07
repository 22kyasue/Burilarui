export interface Notification {
    id: string;
    timestamp: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'update';
    link?: string;
    plan_id?: string;
    read: boolean;
    feedback?: 'useful' | 'not_useful';
    details?: {
        summary: string;
        changes: string[];
        sources: {
            id: string;
            title: string;
            url: string;
            snippet?: string;
        }[];
    };
}
