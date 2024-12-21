import { Router, Request, Response } from 'express';
import { getRequestById } from '../lib/requestStore';
import path from 'path';
import fs from 'fs';

const router = Router();

router.get('/:requestId/:fileIndex', (req: Request, res: Response) => {
    const { requestId, fileIndex } = req.params;
    const request = getRequestById(requestId);
    if (!request || !request.formFields) return res.status(404).send('Not found');
    const index = parseInt(fileIndex, 10);
    const field = request.formFields[index];
    if (!field || !field.filePath) return res.status(404).send('File not found');

    if (fs.existsSync(field.filePath)) {
        res.sendFile(path.resolve(field.filePath));
    } else {
        res.status(404).send('File not found');
    }
});

export default router;
