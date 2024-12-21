export interface RequestRecord {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body?: string;
    formFields?: Record<string, string>;
    ip: string;
    timestamp: number;
    response?: {
        statusCode: number;
        headers: Record<string, string>;
        body: string;
        timeTakenMs: number;
    };
    error?: string;
} 