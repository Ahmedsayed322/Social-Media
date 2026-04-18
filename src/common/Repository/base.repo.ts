import {
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { IUser } from '../../modules/auth/auth.type';

abstract class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<HydratedDocument<T>> {
    return this.model.create(data);
  }

  async findById(
    id: Types.ObjectId,
    options?: QueryOptions&{select?:string[]},
  ): Promise<HydratedDocument<T> | null> {
    const query = this.model
      .findById(id)
      .populate(options?.populate as PopulateOptions);
    if (options?.populate) query.populate(options.populate as PopulateOptions);
    if (options?.select) query.select(options.select);
    return query;
  }

  async find(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T>[]> {
    const query = this.model.find(filter, projection);
    if (options?.skip != null) query.skip(options.skip);
    if (options?.limit != null) query.limit(options.limit);
    if (options?.populate) query.populate(options.populate as PopulateOptions);
    return query;
  }

  async findOne(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T> | null> {
    const query = this.model.findOne(filter, projection);
    if (options?.populate) query.populate(options.populate as PopulateOptions);
    return query;
  }

  async updateOne(
    filter: QueryFilter<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  async deleteOne(
    filter: QueryFilter<T>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndDelete(filter, options);
  }
}

export default BaseRepository;
