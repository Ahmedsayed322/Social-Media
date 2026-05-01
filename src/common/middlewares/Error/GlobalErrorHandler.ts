import { ErrorRequestHandler } from 'express';
import { ApiError } from '../../utils/ApiError/ApiError';
import env from '../../../config/config.service';

interface IErrorResponse {
  success: false;
  message: any;
  stack?: string;
  statusCode: number;
}

export const GlobalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(err);
  }
  const isApiError = err instanceof ApiError;
  const isDev = env.NODE_ENV === 'development';

  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError || isDev ? err.error : 'internal error';
  const response: IErrorResponse = {
    success: false,
    statusCode,
    message,
  };

  if (!isApiError && isDev && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};
