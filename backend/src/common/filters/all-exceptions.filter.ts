import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import neo4j from 'neo4j-driver';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, error: exception.name, message: body }
          : { statusCode: status, error: exception.name, ...(body as object) },
      );
      return;
    }

    const isDbUnreachable =
      neo4j.isRetriableError?.(exception as Error) ||
      /ServiceUnavailable|Could not perform|ECONNREFUSED|SessionExpired/i.test(
        (exception as Error)?.message ?? '',
      );

    if (isDbUnreachable) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'ServiceUnavailable',
        message: 'CognoDB is unreachable right now. Please try again shortly.',
      });
      return;
    }

    this.logger.error((exception as Error)?.stack ?? exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Something went wrong.',
    });
  }
}
