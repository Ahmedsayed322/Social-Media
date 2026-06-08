import {
  graphql,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import { postTypes, userType } from './graphql.types';
import authentication from '../../../common/middlewares/authentication/authentication';
import { Request } from 'express';
import { Validator_Gql } from '../../../common/middlewares/validator/validator';
import { myProfileValidation } from '../auth.validation';
import logger from '../../../common/utils/logger/logger.service';
class UserFields {
  constructor() {}
  query = () => ({
    getMyProfile: {
      type: userType,
      resolve: async (_: any, args: any, context: { req: Request }) => {
        await Validator_Gql(myProfileValidation, context.req.headers);
        const user = await authentication.authenticate_gql(
          context.req.headers.authorization,
        );

        await user.populate({
          path: 'friends',
        });
        logger.info(user.friends);
        return user;
      },
    },
    checkAdminPrivileges: {
      type: userType,
      resolve: async (_: any, args: any, context: { req: Request }) => {
        await Validator_Gql(myProfileValidation, context.req.headers);
        const user = await authentication.authorize_gql(
          ['admin'],
          context.req.headers.authorization!,
        );
        return user;
      },
    },
  });
}
export default new UserFields();
