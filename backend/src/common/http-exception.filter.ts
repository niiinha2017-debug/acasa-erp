import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Filtro global: loga qualquer exceção e devolve resposta HTTP adequada.
 * Evita 500 genérico do nginx sem informação; no console do backend aparece o erro real.
 * Trata também erros do Prisma (ex.: P2025 = registro não encontrado → 404).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Erro interno do servidor.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? (payload as { message: string | string[] }).message
          : String(payload);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.warn(
        `${req.method} ${(req as any).url} → Prisma ${exception.code}: ${exception.message}`,
      );
      switch (exception.code) {
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado.';
          break;
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Já existe um registro com estes dados.';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Referência inválida (registro relacionado não existe).';
          break;
        default:
          message =
            process.env.NODE_ENV === 'production'
              ? 'Erro interno do servidor.'
              : exception.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `${req.method} ${(req as any).url} → ${exception.message}`,
        exception.stack,
      );
      message =
        process.env.NODE_ENV === 'production'
          ? 'Erro interno do servidor.'
          : exception.message;
    }

    const body =
      typeof message === 'object'
        ? {
            statusCode: status,
            ...(Array.isArray(message) ? { message } : message),
          }
        : { statusCode: status, message };

    res.status(status).json(body);
  }
}
