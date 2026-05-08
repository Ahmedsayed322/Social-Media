import { ZodType } from 'zod';
import { Request, Response, NextFunction } from 'express';

type reqType = keyof Request;
type Schema = Partial<Record<reqType, ZodType>>;
const Validator = (Schema: Schema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: {
      path: string;
      message: string;
    }[] = [];
    for (const key of Object.keys(Schema) as reqType[]) {
      if (!Schema[key]) continue;
      if (req.file) {
        req.body.attachment = req.file;
      }
      if (req.files) {
        req.body.attachments = req.files;
      }
      const result = await Schema[key]?.safeParseAsync(req[key]);
      if (!result?.success) {
        result.error.issues.forEach((e) => {
          validationErrors.push({
            path: e.path[0] as string,
            message: e.message,
          });
        });
      }
    }
    if (validationErrors.length) {
      return res.status(400).json({
        success: false,
        message: validationErrors,
      });
    }
    next();
  };
};
export default Validator;
