import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Log file path: backend/requests.log
const logFilePath = path.join(__dirname, '../../../requests.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    const { method, url } = req;

    // Log the incoming request
    const reqLog = `[${timestamp}] REQ: ${method} ${url}\n`;
    logStream.write(reqLog);
    // Also log to console for visibility during dev (optional, but good for "log each and every request")
    // console.log(reqLog.trim()); 

    // Capture response finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const resLog = `[${timestamp}] RES: ${method} ${url} ${statusCode} ${duration}ms\n`;
        logStream.write(resLog);
    });

    next();
}
