import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';

@Injectable()
@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('SecurityFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exception.message || 'Internal server error';

    // SECURITY: Sanitize error messages
    const sanitizedMessage = this.sanitize(message);

    this.logger.error(
      `[${request.method}] ${request.url} - Error: ${sanitizedMessage}`,
      exception.stack?.split('\n').slice(0, 2).join('\n'),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status === HttpStatus.INTERNAL_SERVER_ERROR 
        ? 'A system error occurred. Our team has been notified.' 
        : sanitizedMessage,
    });
  }

  private sanitize(text: string): string {
    if (typeof text !== 'string') return text;
    
    // Redact ARNs and IDs
    const arnPattern = /arn:aws:[a-z0-9:-]+/gi;
    const idPattern = /[A-Z0-9]{16,40}/g;

    return text
      .replace(arnPattern, '[REDACTED_ARN]')
      .replace(idPattern, '[REDACTED_ID]');
  }
}
