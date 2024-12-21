import express from 'express';
import cors from 'cors';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { formParser } from './middleware/formParser';
import { generateId } from './utils/generateId';
import { storeRequest, updateRequest } from './lib/requestStore';
import { broadcastEvent } from './lib/sseManager';
import requestsRouter from './routes/requests';
import eventsRouter from './routes/events';
import replayRouter from './routes/replay';
import filesRouter from './routes/files';
import { forwardRequest } from './utils/forwardRequest';
import { cleanupTempDirectory } from './lib/fileCleanup';
import bodyParser from 'body-parser';
import { argv } from './utils/args';
// Parse command line arguments
(async () => {
    const recievedArgs = await yargs(hideBin(process.argv))
        .options({
            'target': {
                type: 'string',
                description: 'Target URI to forward requests to',
                demandOption: true
            },
            'interceptor-port': {
                type: 'number',
                description: 'Port for the interceptor to listen on',
                default: argv.interceptorPort
            },
            'api-port': {
                type: 'number',
                description: 'Port for the API routes',
                default: argv.apiPort
            }
        })
        .argv;

    argv.target = recievedArgs.target;
    argv.interceptorPort = recievedArgs['interceptor-port'];
    argv.apiPort = recievedArgs['api-port'];

    // Create two separate Express apps
    const interceptorApp = express();
    const apiApp = express();

    // Middleware for both apps
    interceptorApp.use(cors());
    interceptorApp.use(bodyParser.json());
    interceptorApp.use(formParser);

    apiApp.use(cors());
    apiApp.use(bodyParser.json());

    // Intercept all requests on the interceptor app
    interceptorApp.use((req, res, next) => {
        const id = generateId();
        const isFormData = (req as any).formFields !== undefined;
        const requestRecord = {
            id,
            method: req.method,
            url: req.url,
            headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
            query: req.query as Record<string, string>,
            body: !isFormData ? (req.body ? JSON.stringify(req.body) : '') : undefined,
            formFields: isFormData ? (req as any).formFields : undefined,
            ip: req.ip?.toString() || 'UNKNOWN',
            timestamp: Date.now()
        };

        storeRequest(requestRecord);
        broadcastEvent('new_request', { id, method: req.method, url: requestRecord.url, status: 'pending' });

        forwardRequest(requestRecord).then(response => {
            console.log('Response', response);
            updateRequest(id, { response });
            broadcastEvent('update_request', { id, response });
            return res.status(response.statusCode).set(response.headers).send(response.body);
        }).catch(err => {
            console.error('Forwarding error', err);
            broadcastEvent('update_request', { id, error: String(err) });
            return res.status(500).send('Error forwarding request');
        });
    });

    // API routes on the API app
    apiApp.use('/requests', requestsRouter);
    apiApp.use('/events', eventsRouter);
    apiApp.use('/replay', replayRouter);
    apiApp.use('/files', filesRouter);

    // Cleanup temp directory on startup
    cleanupTempDirectory();

    // Start both servers
    interceptorApp.listen(argv.interceptorPort, () => {
        console.log(`Interceptor running on http://localhost:${argv.interceptorPort}`);
        console.log(`Forwarding requests to: ${argv.target}`);
    });

    apiApp.listen(argv.apiPort, () => {
        console.log(`API running on http://localhost:${argv.apiPort}`);
    });
})();
