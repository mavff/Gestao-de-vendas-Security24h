import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { JsonLoggerInterceptor } from './common/json-logger.interceptor';
import { RateLimitMiddleware } from './common/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  // Raise body limit to support photo uploads (base64 JSON payloads)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(new RateLimitMiddleware().use);

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new JsonLoggerInterceptor());

  const port = Number(process.env.PORT || 3001);
  const logger = new Logger('Bootstrap');

  await app.listen(port, '0.0.0.0');
  logger.log(`API running on http://localhost:${port}`);
  logger.log(`Health: http://localhost:${port}/health`);

  if (!process.env.DATABASE_URL && !process.env.SQL_SERVER_HOST) {
    logger.warn('DATABASE_URL not set — DB endpoints will return DB_NOT_CONFIGURED');
  }
}

bootstrap();
