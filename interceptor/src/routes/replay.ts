import { Router, Request, Response } from 'express';
import { getRequestById, storeRequest, updateRequest } from '../lib/requestStore';
import { generateId } from '../utils/generateId';
import { broadcastEvent } from '../lib/sseManager';
import { forwardRequest } from '../utils/forwardRequest';

const router = Router();

router.post('/:id', async (req: Request, res: Response) => {
    const original = getRequestById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Request not found' });

    // Build a new request object from the original, but possibly modified
    const newId = generateId();
    const newReq = {
        ...original,
        id: newId,
        timestamp: Date.now()
    };

    // If user modifies the request, handle that here (for brevity, skipping actual modify logic)
    // For now assume `req.body` contains modifications (headers, url, etc.)

    storeRequest(newReq);
    broadcastEvent('new_request', { id: newReq.id, method: newReq.method, url: newReq.url, status: 'pending' });

    try {
        const response = await forwardRequest(newReq);
        updateRequest(newReq.id, { response });
        broadcastEvent('update_request', { id: newReq.id, response });
    } catch (error) {
        console.error(error);
        broadcastEvent('update_request', { id: newReq.id, error: String(error) });
    }

    res.json({ success: true });
});

export default router;
