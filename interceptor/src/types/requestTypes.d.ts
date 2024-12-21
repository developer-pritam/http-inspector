export interface FormField {
    name: string;
    value?: string;
    filePath?: string;
    originalFilename?: string;
    mimeType?: string;
    size?: number;
}

export interface StoredRequest {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body?: string;
    formFields?: FormField[];
    ip: string;
    timestamp: number;
    response?: {
        statusCode: number;
        headers: Record<string, string>;
        body: string;
        timeTakenMs: number;
    };
}
