import multer from 'multer';
import { tmpdir } from 'node:os';
import { ApiError } from '../../utils/ApiError/ApiError';

const multerCloud = (isDiskStorage = false) => {
  const storage = isDiskStorage
    ? multer.diskStorage({
        destination: (
          req: Express.Request,
          file: Express.Multer.File,
          cb: Function,
        ) => {
          cb(null, tmpdir());
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-' + file.originalname);
        },
      })
    : multer.memoryStorage();
  const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: Function,
  ) => {
    if (
      (file.mimetype.startsWith('image/')|| file.mimetype.startsWith('video/'))
    ) {
      cb(null, true);
    } else {
      cb(new ApiError('Only image files are allowed!', 400));
    }
  };
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};
export default multerCloud;
