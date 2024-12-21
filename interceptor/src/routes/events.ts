import { Router, Response, Request } from 'express';
import { addClient } from '../lib/sseManager';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();
    addClient(res);
});

export default router;
