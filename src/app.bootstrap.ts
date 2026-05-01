import express, { Response, Request, NextFunction } from 'express';
import env from './config/config.service';
import helmet from 'helmet';
import { rateLimiter } from './common/middlewares/rateLimit/rateLimit';
import cors from 'cors';
import logger from './common/utils/logger/logger.service';
import corsOption from './common/middlewares/cors/cors';
import { ApiError } from './common/utils/ApiError/ApiError';
import { GlobalErrorHandler } from './common/middlewares/Error/GlobalErrorHandler';
import authRouter from './modules/auth/auth.controller';
import connectDb from './db/db.connection';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import redisService from './common/service/redis/redis.service';

import s3Service from './common/service/cloude/s3.service';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
const s3WritableStream = promisify(pipeline);
const bootstrap = async () => {
  const app = express();
  await Promise.all([connectDb(), redisService.connect()]);
  app.use(
    compression({
      threshold: 1024,
    }),
    morgan('short'),
    express.json(),
    helmet(),
    rateLimiter.global(),
    cors(corsOption),
    cookieParser(),
  );
  app.get('/', (req, res) => {
    return res.status(200).json({ message: 'welcome to social app apis' });
  });
  app.get(
    '/uploads/*path',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { path } = req.params as { path: string[] };
        const key = path.join('/');
        const url = await s3Service.getFile(key);
        res.setHeader(
          'Content-Type',
          url.ContentType || 'application/octet-stream',
        );
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        if (req.query.download) {
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${key.split('/').at(-1)}"`,
          );
        }
        await s3WritableStream(url.Body as ReadableStream, res);
      } catch (err: any) {
        if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
        if (!res.headersSent) {
          next(err);
        }
      }
    },
  );
  app.get(
    '/pre-signed/*path',
    async (req: Request, res: Response, next: NextFunction) => {
      const { path } = req.params as { path: string[] };
      const { download } = req.query as { download?: boolean };
      const key = path.join('/');
      const url = await s3Service.getPresignedLink(key, download as boolean);
      return res.status(200).json({ url });
    },
  );
  app.use('/api/auth', authRouter);
  app.use('{/*dummy}', () => {
    throw new ApiError('invalid route', 404);
  });
  app.use(GlobalErrorHandler);
  app.listen(env.PORT, () => {
    logger.info(`Server is running on port ${env.PORT}`);
  });
};

export default bootstrap;
