import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http';

export const notFound: RequestHandler = () => {
  throw new HttpError(404, 'Route not found');
};

export const pending: RequestHandler = () => {
  throw new HttpError(501, 'Endpoint is reserved for a future implementation');
};

export const handleError: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
    });
    return;
  }
  let status = 500;
  let message = 'Internal server error';
  if (error instanceof HttpError) {
    ({ status, message } = error);
  } else if (error instanceof Error && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      status = 400;
      message = 'Malformed JSON';
    } else if (error.type === 'entity.too.large') {
      status = 413;
      message = 'Request body too large';
    }
  }
  if (status === 500)
    console.error('Unhandled API error', error instanceof Error ? error.name : 'Unknown');
  res.status(status).json({ success: false, message, errors: [] });
};
