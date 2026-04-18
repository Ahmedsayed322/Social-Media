import { createClient } from 'redis';
import env from '../config/config.service';
import logger from '../common/utils/logger/logger.service';

export const redisClient = createClient({
  url: env.UPSTASH_REDIS_URL,
});
export const redisConnection = async () => {
  await redisClient
    .connect()
    .then(() => {
      logger.info('connected to Redis Successfully');
    })
    .catch((err) => {
      logger.error('connected to Redis failed', err);
    });
};
