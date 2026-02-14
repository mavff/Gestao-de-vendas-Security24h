import { HttpException, HttpStatus } from '@nestjs/common';

export class DbNotConfiguredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'DB_NOT_CONFIGURED',
        message: 'Database connection is not configured. Set DATABASE_URL in .env to enable this endpoint.',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
