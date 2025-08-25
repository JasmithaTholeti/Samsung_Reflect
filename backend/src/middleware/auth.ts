import { Request, Response, NextFunction } from 'express';


// Minimal auth: read X-User-Id header or set a demo user
export function mockAuth(req: Request, _res: Response, next: NextFunction) {
const headerId = req.header('X-User-Id');
(req as any).user = { id: headerId || 'demo-user' };
next();
}