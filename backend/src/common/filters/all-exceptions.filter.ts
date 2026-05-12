import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorCode = (message as any).errorCode || 'INTERNAL_SERVER_ERROR';
    const friendlyMessage = (message as any).message || (typeof message === 'string' ? message : 'An unexpected error occurred');

    response.status(status).json({
      success: false,
      message: friendlyMessage,
      errorCode: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
