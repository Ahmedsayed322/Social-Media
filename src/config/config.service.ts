import { config } from 'dotenv';
import { resolve } from 'path';
import logger from '../common/utils/logger/logger.service';
import { IEnv } from './env.type';
config({
  path: resolve(`.env.${process.env.NODE_ENV}`),
});
const env: IEnv = {
  PORT: +(process.env.PORT as string) as number,
  NODE_ENV: process.env.NODE_ENV as string,
  WHITE_LIST: (process.env.WHITE_LIST as string).split(','),
  DB_URI: process.env.DB_URI as string,
  JWT_ACCESS_KEY: process.env.JWT_ACCESS_KEY as string,
  JWT_REFRESH_KEY: process.env.JWT_REFRESH_KEY as string,
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL as string,
  MY_EMAIL: process.env.MY_EMAIL as string,
  CONSUMER_SECRET: process.env.CONSUMER_SECRET as string,
  CLIENT_ID: process.env.CLIENT_ID as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWS_REGION: process.env.AWS_REGION as string,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME as string,
};

for (const [key, value] of Object.entries(env)) {
  if (!value) {
    logger.error(`${key} is missing in environment variables`);
    process.exit(1);
  }
}

export default env;
