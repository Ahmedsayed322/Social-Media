import { Response } from 'express';
export const successfulResponse = (
  res: Response,
  code: number,
  message: string,
  data?: any,
) => {
  return res.status(code).json({
    success: true,
    message,
    ...data
  });
};
