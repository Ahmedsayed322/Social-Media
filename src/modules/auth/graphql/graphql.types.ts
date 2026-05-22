import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  AllowCommentEnum,
  AvailabilityEnum,
  ReactEnum,
} from '../../../common/utils/enums/post.enum';

export const postTypes = new GraphQLObjectType({
  name: 'PostObject',
  fields: {
    _id: { type: GraphQLID },
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },
    createdBy: { type: GraphQLString },
    tags: {
      type: new GraphQLList(GraphQLString),
    },
    reactions: {
      type: new GraphQLList(
        new GraphQLEnumType({
          name: 'reactionsTypes',
          values: {
            like: { value: ReactEnum.like },
            love: { value: ReactEnum.love },
            sad: { value: ReactEnum.sad },
            angry: { value: ReactEnum.angry },
            smile: { value: ReactEnum.smile },
            wow: { value: ReactEnum.wow },
          },
        }),
      ),
    },
    allowComment: {
      type: new GraphQLEnumType({
        name: 'allowCommentTypes',
        values: {
          deny: { value: AllowCommentEnum.deny },
          allow: { value: AllowCommentEnum.allow },
        },
      }),
    },
    availability: {
      type: new GraphQLEnumType({
        name: 'availabilityTypes',
        values: {
          only_me: { value: AvailabilityEnum.only_me },
          friends: { value: AvailabilityEnum.friends },
          public: { value: AvailabilityEnum.public },
        },
      }),
    },
    folderId: { type: GraphQLString },
  },
});

export const userType = new GraphQLObjectType({
  name: 'UserObject',
  fields: {
    _id: { type: GraphQLID },

    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },

    email: { type: GraphQLString },
    gender: { type: GraphQLString },

    password: { type: GraphQLString },

    provider: { type: GraphQLString },
    role: { type: GraphQLString },

    pfp: { type: GraphQLString },

    gallery: {
      type: new GraphQLList(GraphQLString),
    },

    friends: {
      type: new GraphQLList(GraphQLID),
    },

    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
    changeCredentials: { type: GraphQLString },

  },
});
