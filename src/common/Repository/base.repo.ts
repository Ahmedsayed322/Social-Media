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
    options?: QueryOptions & { select?: string[] },
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
  async findOneAndUpdate(
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

  async softDeleteOne(
    filter: QueryFilter<T>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndUpdate(
      filter,
      { deletedAt: new Date() } as UpdateQuery<T>,
      {
        new: true,
        ...options,
      },
    );
  }

  async restoreOne(
    filter: QueryFilter<T>,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOneAndUpdate(
      filter,
      { $unset: { deletedAt: 1 } } as UpdateQuery<T>,
      {
        new: true,
        ...options,
      },
    );
  }
  async paginate<T>({
    page,
    limit,
    sort,
    populate,
    search,
  }: {
    page?: number;
    limit?: number;
    sort?: any;
    populate?: PopulateOptions;
    search?: QueryFilter<T>;
  }) {
    page = +page! || 1;
    limit = +limit! || 10;
    if (page < 0) page = 1;
    if (limit < 0) limit = 10;
    const skip = (page - 1) * limit;
    const [data, totalDoc] = await Promise.all([
      this.model
        .find({ ...(search ?? {}) })
        .limit(limit)
        .skip(skip)
        .populate(populate!),
      this.model.countDocuments(),
    ]);
    return { currentPage: page, totalPages: Math.ceil(totalDoc / limit), data };
  }
}

export default BaseRepository;
