import { StoredRequest } from '../types/requestTypes';

export function buildCurlCommand(req: StoredRequest): string {
    let curl = `curl -X ${req.method.toUpperCase()} '${req.url}'`;
    for (const [hKey, hValue] of Object.entries(req.headers)) {
        // Skip host header
        if (hKey.toLowerCase() === 'host') continue;
        curl += ` -H '${hKey}: ${hValue}'`;
    }

    if (req.formFields && req.formFields.length > 0) {
        // form data
        for (const field of req.formFields) {
            if (field.filePath) {
                curl += ` -F '${field.name}=@${field.filePath}'`;
            } else {
                curl += ` -F '${field.name}=${field.value || ''}'`;
            }
        }
    } else if (req.body) {
        curl += ` --data '${req.body}'`;
    }
    return curl;
}
