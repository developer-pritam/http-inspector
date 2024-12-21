import { RequestRecord } from '@/types/request';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class APIClient {
    private eventSource: EventSource | null = null;
    private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

    async getAllRequests(): Promise<RequestRecord[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/requests`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            throw error;
        }
    }

    async replayRequest(requestId: string): Promise<RequestRecord> {
        try {
            const response = await fetch(`${API_BASE_URL}/replay/${requestId}`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to replay request:', error);
            throw error;
        }
    }

    subscribeToEvents(onNewRequest: (data: any) => void, onUpdateRequest: (data: any) => void) {
        if (this.eventSource) {
            return;
        }

        this.eventSource = new EventSource(`${API_BASE_URL}/events`);

        this.addEventListener('new_request', onNewRequest);
        this.addEventListener('update_request', onUpdateRequest);

        this.eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            this.reconnect();
        };
    }

    private addEventListener(event: string, callback: (data: any) => void) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);

        this.eventSource?.addEventListener(event, (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            callback(data);
        });
    }

    private reconnect() {
        setTimeout(() => {
            this.unsubscribeFromEvents();
            // Recreate event source with existing listeners
            if (this.eventListeners.size > 0) {
                this.eventSource = new EventSource(`${API_BASE_URL}/events`);
                this.eventListeners.forEach((callbacks, event) => {
                    callbacks.forEach(callback => {
                        this.addEventListener(event, callback);
                    });
                });
            }
        }, 1000);
    }

    unsubscribeFromEvents() {
        this.eventSource?.close();
        this.eventSource = null;
        this.eventListeners.clear();
    }
}

export const apiClient = new APIClient(); 