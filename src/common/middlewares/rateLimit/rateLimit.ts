import { Response } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { ApiError } from '../../utils/ApiError/ApiError';

export const rateLimiter = {
  global(): RateLimitRequestHandler {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      handler: (_, res: Response) => {
        throw new ApiError('Too many attempts, please try again later.', 429);
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  },
};
