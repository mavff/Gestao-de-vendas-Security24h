import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper around PrismaClient with fail-soft behavior.
 * If DATABASE_URL is not configured, all queries throw a controlled
 * DB_NOT_CONFIGURED error instead of crashing the application.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  constructor() {
    super({
      datasourceUrl: process.env.DATABASE_URL || undefined,
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL not set — Prisma operating in fail-soft mode');
      return;
    }

    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Prisma connected to SQL Server');
    } catch (err) {
      this.logger.error('Failed to connect to SQL Server — fail-soft mode active', (err as Error).message);
    }
  }

  /**
   * Call this at the start of any repository method.
   * Throws ServiceUnavailableException if DB is not available.
   */
  ensureConnection(): void {
    if (!process.env.DATABASE_URL) {
      throw new ServiceUnavailableException({
        error: 'DB_NOT_CONFIGURED',
        message: 'Database connection is not configured. Set DATABASE_URL in your .env file.',
      });
    }

    if (!this.connected) {
      throw new ServiceUnavailableException({
        error: 'DB_NOT_CONNECTED',
        message: 'Database is configured but not connected. Check your connection settings.',
      });
    }
  }
}
