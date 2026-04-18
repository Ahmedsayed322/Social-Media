import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../utils/ApiError/ApiError';
import JWTService from '../../utils/JWT/JWT.service';
import userRepo from '../../Repository/user.repo';
import { AuthRequest, IUser } from '../../../modules/auth/auth.type';
import redisInst, { RedisRepo } from '../../Repository/redis.repo';

export class Auth {
  constructor(private redis: RedisRepo) {}
  private getUser = async (req: AuthRequest, res: Response) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new ApiError('missing authorization header', 401);
    }
    const [prefix, token] = (authorization as string).split(' ');
    if (!token || prefix !== 'Bearer') {
      throw new ApiError('invalid token format', 401);
    }
    const decoded = JWTService.verifyAccessToken(token);

    const user = await userRepo.findById(decoded.id);

    if (!user) {
      throw new ApiError('invalid credentials', 401);
    }
    const isRevoked = await this.redis.getValue(
      `revokeToken::${user!._id}::${decoded.jti}`,
    );
    if (isRevoked) {
      throw new ApiError('invalid credentials', 401);
    }
    if (user.changeCredentials!.getTime() > decoded.iat! * 1000) {
      throw new ApiError('invalid credentials', 401);
    }

    req.user = user;
    req.decoded = decoded;
  };
  authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    await this.getUser(req, res);
    next();
  };
  authorize = (types: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      await this.getUser(req, res);
      if (!types.includes(req.user!.role)) {
        throw new ApiError('you do not have access', 403);
      }
      next();
    };
  };
}
export default new Auth(redisInst);
