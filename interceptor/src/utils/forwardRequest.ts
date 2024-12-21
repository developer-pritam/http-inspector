import { StoredRequest } from '../types/requestTypes';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { argv } from './args';
export async function forwardRequest(originalReq: StoredRequest): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    timeTakenMs: number;
}> {
    const targetUrl = new URL(argv.target + originalReq.url);
    if (originalReq.query) {
        Object.entries(originalReq.query).forEach(([key, value]) => {
            targetUrl.searchParams.append(key, value);
        });
    }
    const start = Date.now();

    try {
        let data: string | FormData | undefined;
        let headers = { ...originalReq.headers };

        // Remove problematic headers
        delete headers['host'];
        delete headers['content-length'];

        if (originalReq.formFields?.length) {
            const form = new FormData();

            for (const field of originalReq.formFields) {
                if (field.filePath) {
                    if (fs.existsSync(field.filePath)) {
                        form.append(
                            field.name,
                            fs.createReadStream(field.filePath),
                            {
                                filename: field.originalFilename,
                                contentType: field.mimeType
                            }
                        );
                    }
                } else {
                    form.append(field.name, field.value || '');
                }
            }

            data = form;
            headers = {
                ...headers,
                ...form.getHeaders()
            };
        } else {
            data = originalReq.body;
        }

        const response = await axios({
            method: originalReq.method,
            url: targetUrl.toString(),
            headers,
            data,
            validateStatus: () => true, // Don't throw on any status code
            transformResponse: [(data) => {
                // Try to parse and prettify JSON responses
                if (typeof data === 'string') {
                    try {
                        return JSON.stringify(JSON.parse(data), null, 2);
                    } catch {
                        return data;
                    }
                }
                return String(data);
            }],
            maxRedirects: 5,
            timeout: 60000 // 60 second timeout
        });

        return {
            statusCode: response.status,
            headers: Object.fromEntries(
                Object.entries(response.headers)
                    .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)])
            ),
            body: response.data,
            timeTakenMs: Date.now() - start
        };

    } catch (error) {
        console.error('Request error:', error);
        const axiosError = error as AxiosError;

        return {
            statusCode: axiosError.response?.status || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: axiosError.message || 'Internal Server Error',
            timeTakenMs: Date.now() - start
        };
    }
}
