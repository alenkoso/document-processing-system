import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const startTime = Symbol('startTime');

declare global {
  namespace Express {
    interface Request {
      [startTime]: number;
    }
  }
}

export const monitorRequest = (req: Request, res: Response, next: NextFunction) => {
  req[startTime] = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - req[startTime];
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
      userAgent: req.get('user-agent')
    });
  });

  next();
}; 