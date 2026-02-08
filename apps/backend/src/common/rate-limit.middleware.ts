import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, { count: number; expiresAt: number }>();

  use = (req: Request, res: Response, next: NextFunction): void => {
    const ttl = Number(process.env.RATE_LIMIT_TTL || 60) * 1000;
    const limit = Number(process.env.RATE_LIMIT_LIMIT || 100);
    const now = Date.now();
    const key = req.ip;
    const record = this.hits.get(key);

    if (!record || record.expiresAt < now) {
      this.hits.set(key, { count: 1, expiresAt: now + ttl });
      next();
      return;
    }

    if (record.count >= limit) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    record.count += 1;
    next();
  };
}
