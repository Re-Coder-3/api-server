import { ToggleHeartMutationArgs, toggleHeartReturnType } from '../../types/graph';
import { Context } from 'graphql-yoga/dist/types';
import { getUser } from '../../utils';
import { Heart, User, Profile } from '../../db';
import { Op } from 'sequelize';

export default {
  Query: {
    getHeartUser: async (_: any, __: any, context: Context) => {
      try {
        const u = getUser(context);
        const user_idx = u?.user_idx!;
        const heartUser = await Heart.findAll({
          where: {
            user_idx,
          },
          attributes: ['heart_idx', 'target_user_idx', 'target_post_idx', 'user_idx'],
          include: [
            {
              model: User,
              foreignKey: 'target_user_idx',
              required: true,
              include: [
                {
                  model: Profile,
                  required: false,
                },
              ],
            },
          ],
        });
        console.log(heartUser);
        return {
          status: 200,
          data: heartUser,
          error: null,
        };
      } catch (e) {
        console.log(e);
      }
    },
  },
  Mutation: {
    toggleHeart: async (
      _: any,
      args: ToggleHeartMutationArgs,
      context: Context,
    ): Promise<toggleHeartReturnType> => {
      try {
        const u = getUser(context);
        const user_idx = u?.user_idx!;
        const { target_post_idx, target_user_idx } = args;
        if (target_user_idx) {
          const heartCheck = await Heart.findOne({
            where: {
              [Op.and]: [{ user_idx }, { target_user_idx }],
            },
          });
          // * 하트가 이미 눌러져있으면 취소시키기
          if (heartCheck) {
            await Heart.destroy({
              where: {
                heart_idx: heartCheck.heart_idx,
              },
            });
            return {
              status: 200,
              error: null,
              data: false,
            };
          } else {
            await Heart.create({
              heart_idx: '',
              user_idx,
              target_post_idx: null,
              target_user_idx,
            });
            return {
              status: 200,
              error: null,
              data: true,
            };
          }
        } else if (target_post_idx) {
          const heartCheck = await Heart.findOne({
            where: {
              [Op.and]: [{ user_idx }, { target_post_idx }],
            },
          });
          // * 하트가 이미 눌러져있으면 취소시키기
          if (heartCheck) {
            await Heart.destroy({
              where: {
                heart_idx: heartCheck.heart_idx,
              },
            });
            return {
              status: 200,
              error: null,
              data: false,
            };
          } else {
            await Heart.create({
              heart_idx: '',
              user_idx,
              target_post_idx,
              target_user_idx: null,
            });
            return {
              status: 200,
              error: null,
              data: true,
            };
          }
        } else {
          return {
            status: 400,
            error: 'noTarget',
            data: false,
          };
        }
      } catch (e) {
        console.log(e);
        return {
          status: 500,
          data: false,
          error: 'serverError',
        };
      }
    },
  },
};
