import express from 'express';
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
    res.status(200).json({ message: 'welcome to social app apis' });
  });

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
