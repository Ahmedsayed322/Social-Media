export interface IEnv {
  PORT: number;
  NODE_ENV: string;
  WHITE_LIST: string[];
  DB_URI: string;
  JWT_ACCESS_KEY: string;
  JWT_REFRESH_KEY: string;
  UPSTASH_REDIS_URL: string;
  CONSUMER_SECRET: string;
  MY_EMAIL: string;
  CLIENT_ID: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_BUCKET_NAME: string;
}
