import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/** Global per-IP rate limit + tighter bucket para /auth/login (brute-force). */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, { count: number; expiresAt: number }>();
  private readonly loginHits = new Map<string, { count: number; expiresAt: number }>();

  use = (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const ip = req.ip ?? '0.0.0.0';

    if (req.method === 'POST' && req.path === '/auth/login') {
      const ttl = Number(process.env.RATE_LIMIT_LOGIN_TTL || 60) * 1000;
      const limit = Number(process.env.RATE_LIMIT_LOGIN_LIMIT || 5);
      const rec = this.loginHits.get(ip);
      if (!rec || rec.expiresAt < now) {
        this.loginHits.set(ip, { count: 1, expiresAt: now + ttl });
      } else if (rec.count >= limit) {
        res.status(429).json({ message: 'Too many login attempts' });
        return;
      } else {
        rec.count += 1;
      }
    }

    const ttl = Number(process.env.RATE_LIMIT_TTL || 60) * 1000;
    const limit = Number(process.env.RATE_LIMIT_LIMIT || 100);
    const record = this.hits.get(ip);

    if (!record || record.expiresAt < now) {
      this.hits.set(ip, { count: 1, expiresAt: now + ttl });
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
