import { Request, Response, NextFunction } from 'express';
import * as Busboy from 'busboy';
import fs from 'fs';
import path from 'path';

export function formParser(req: Request, res: Response, next: NextFunction) {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        const busboy = Busboy.default({ headers: req.headers });
        const fields: any[] = [];

        busboy.on('field', (fieldname, val) => {
            fields.push({ name: fieldname, value: val });
        });

        busboy.on('file', (fieldname: string, file: any, filename: string, encoding: string, mimetype: string) => {
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const saveTo = path.join(tempDir, Date.now() + '-' + filename);
            const fstream = fs.createWriteStream(saveTo);
            file.pipe(fstream);
            fstream.on('close', () => {
                fields.push({
                    name: fieldname,
                    filePath: saveTo,
                    originalFilename: filename,
                    mimeType: mimetype
                });
            });
        });

        busboy.on('finish', () => {
            (req as any).formFields = fields;
            next();
        });

        req.pipe(busboy);
    } else {
        next();
    }
}
