import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class JsonLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const payload = {
          level: 'info',
          method: req.method,
          path: req.url,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
          user: req.user?.username ?? null,
          at: new Date().toISOString()
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(payload));
      })
    );
  }
}
