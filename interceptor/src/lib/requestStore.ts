import { StoredRequest } from '../types/requestTypes';

const requestsMap = new Map<string, StoredRequest>();

export function storeRequest(req: StoredRequest) {
    requestsMap.set(req.id, req);
}

export function getAllRequests(): StoredRequest[] {
    return Array.from(requestsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

export function getRequestById(id: string): StoredRequest | undefined {
    return requestsMap.get(id);
}

export function updateRequest(id: string, updatedFields: Partial<StoredRequest>) {
    const req = requestsMap.get(id);
    if (req) {
        Object.assign(req, updatedFields);
        requestsMap.set(id, req);
    }
}

export function clearStore() {
    requestsMap.clear();
}
