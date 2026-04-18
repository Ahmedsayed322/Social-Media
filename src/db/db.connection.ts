import { connect } from 'mongoose';
import env from '../config/config.service';
import logger from '../common/utils/logger/logger.service';

const connectDb = () => {
  const { DB_URI } = env;
  connect(DB_URI)
    .then(() => {
      logger.info('Db connected successfully');
    })
    .catch((e) => {
      console.log(e);

      logger.error('failed to connect db', e);
    });
};
export default connectDb;
