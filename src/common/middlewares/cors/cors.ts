import { CorsOptions } from 'cors';
import env from '../../../config/config.service';
import { ApiError } from '../../utils/ApiError/ApiError';
const whiteList = new Set<string | undefined>([undefined, ...env.WHITE_LIST]);
console.log(whiteList);

const corsOption: CorsOptions = {
  origin(requestOrigin, callback) {
    if (whiteList.has(requestOrigin)) {
      return callback(null, true);
    }
    return callback(new ApiError('cors error', 403));
  },
  credentials: true,
};
export default corsOption;
