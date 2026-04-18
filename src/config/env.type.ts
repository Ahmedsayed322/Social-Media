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
}
