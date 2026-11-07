import type { Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, message: 'Request successful', data });
}
