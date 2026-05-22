import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import graphField from '../../modules/auth/graphql/graphql.fields';

export const GraphSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'GraphQlRoot',
    fields: { ...graphField.query() },
  }),
  // mutation: new GraphQLObjectType({
  //   name: 'MutationRoot',
  //   fields: {
  //     addNewUser: {
  //       type: userType,
  //       args: {
  //         id: { type: new GraphQLNonNull(GraphQLInt) },
  //         name: { type: new GraphQLNonNull(GraphQLString) },
  //         age: { type: new GraphQLNonNull(GraphQLInt) },
  //         gender: { type: genderType },
  //       },
  //       resolve: (_, args) => {
  //         const newUser = users.findIndex((u) => u.id === args.id);
  //         if (newUser !== -1) {
  //           throw new ApiError('user already exist', 409);
  //         }
  //         users.push(args);
  //         return args;
  //       },
  //     },
  //   },
  // }),
});
