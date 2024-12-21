import { Response } from 'express';

const clients: Response[] = [];

export function addClient(res: Response) {
    clients.push(res);
    res.on('close', () => {
        removeClient(res);
    });
}

function removeClient(res: Response) {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
}

export function broadcastEvent(eventType: string, data: any) {
    const msg = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
        client.write(msg);
    }
}
