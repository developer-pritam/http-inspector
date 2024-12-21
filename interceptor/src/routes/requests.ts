import { Router, Request, Response } from 'express';
import { getAllRequests } from '../lib/requestStore';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json(getAllRequests());
});

export default router;
