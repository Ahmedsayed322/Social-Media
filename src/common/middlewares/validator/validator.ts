import { ZodType } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import path from 'node:path';

type reqType = keyof Request;
type Schema = Partial<Record<reqType, ZodType>>;
export const Validator = (Schema: Schema) => {
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
export const Validator_Gql = async (schema: ZodType, data: any) => {
  const validationErrors: {
    path: string;
    message: string;
  }[] = [];

  const result = await schema?.safeParseAsync(data);
  if (!result?.success) {
    result.error.issues.forEach((e) => {
      validationErrors.push({
        path: e.path[0] as string,
        message: e.message,
      });
    });
  }
  console.log({ validationErrors });

  if (validationErrors.length) {
    throw new GraphQLError('validation error', {
      extensions: {
        code: 'VALIDATION_ERROR',

        validationErrors,
      },
    });
  }
};
