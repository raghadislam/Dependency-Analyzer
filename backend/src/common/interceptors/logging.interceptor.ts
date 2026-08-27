import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

interface ResponseError extends Error {
  status?: number;
  statusCode?: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, url, query, params, headers } = req;
    const body = req.body as Record<string, unknown>;
    const startTime = Date.now();

    const rawRequestId = headers['x-request-id'];
    const requestId =
      (Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId) || randomUUID();
    res.setHeader('x-request-id', requestId);

    const requestLog: Record<string, unknown> = {
      type: 'REQUEST',
      requestId,
      method,
      url,
      ip: req.ip,
    };

    if (query && Object.keys(query).length > 0) {
      requestLog.query = query;
    }
    if (params && Object.keys(params).length > 0) {
      requestLog.params = params;
    }
    if (body && Object.keys(body).length > 0) {
      requestLog.body = body;
    }

    this.logger.log(requestLog);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log({
            type: 'RESPONSE',
            requestId,
            method,
            url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
          });
        },

        error: (error: ResponseError) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          this.logger.error({
            type: 'ERROR',
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            message: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }
}
