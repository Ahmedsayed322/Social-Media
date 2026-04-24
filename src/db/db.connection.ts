import { connect } from 'mongoose';
import env from '../config/config.service';
import logger from '../common/utils/logger/logger.service';

const connectDb = async () => {
  const { DB_URI } = env;
  try {
    await connect(DB_URI);
    logger.info('Db connected successfully');
  } catch (e) {
    logger.error({ err: e }, 'failed to connect db');
    throw e;
  }
};
export default connectDb;
