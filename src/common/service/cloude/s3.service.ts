import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import env from '../../../config/config.service';

import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { ApiError } from '../../utils/ApiError/ApiError';
import { Upload } from '@aws-sdk/lib-storage';
import { Types } from 'mongoose';
import { extname } from 'node:path';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../../utils/logger/logger.service';

export class S3Service {
  private s3: S3Client;
  constructor() {
    this.s3 = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  async uploadFile({
    key = 'General',
    isDiskStorage = false,
    userId,
    ACL = ObjectCannedACL.private,
    file,
  }: {
    file: Express.Multer.File;
    key?: string;
    isDiskStorage?: boolean;
    ACL?: ObjectCannedACL;
    userId?: Types.ObjectId;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      ACL,
      Key: `users/${userId}/${key}${extname(file.originalname)}`,
      ContentType: file.mimetype,
      Body: isDiskStorage ? createReadStream(file.path) : file.buffer,
    });
    if (!command.input.Key) {
      throw new ApiError('failed to upload file', 500);
    }
    await this.s3.send(command);
    return command.input.Key;
  }
  async uploadLargeFile({
    key = 'General',
    userId,
    ACL = ObjectCannedACL.private,
    file,
  }: {
    file: Express.Multer.File;
    key?: string;
    ACL?: ObjectCannedACL;
    userId: Types.ObjectId;
  }): Promise<string> {
    const command = new Upload({
      client: this.s3,
      params: {
        Bucket: env.AWS_BUCKET_NAME,
        ACL,
        Key: `users/${userId}/${key}/${randomUUID()}-${file.originalname}`,
        ContentType: file.mimetype,
        Body: createReadStream(file.path),
      },
    });

    const op = await command.done();
    return op.Key as string;
  }
  async uploadFiles({
    key = 'General',
    userId,
    ACL = ObjectCannedACL.private,
    files,
    isLargeFiles = false,
  }: {
    files: Express.Multer.File[];
    key?: string;
    isLargeFiles?: boolean;
    ACL?: ObjectCannedACL;
    userId: Types.ObjectId;
  }) {
    let urls: string[] = [];
    if (isLargeFiles) {
      urls = await Promise.all(
        files.map((file) =>
          this.uploadLargeFile({
            file,
            key: `${key}/${randomUUID()}`,
            userId,
            ACL,
          }),
        ),
      );
    } else {
      urls = await Promise.all(
        files.map((file) =>
          this.uploadFile({
            file,
            key: `${key}/${randomUUID()}`,
            userId,
            ACL,
            isDiskStorage: false,
          }),
        ),
      );
    }
    return urls;
  }
  async createPresignedUrl({
    key,
    ACL = ObjectCannedACL.private,
    ContentType,
    OriginalName,
    expiresIn = 2 * 60 * 60,
    rootName = 'general',
    userId,
  }: {
    key: string;
    ACL?: ObjectCannedACL;
    ContentType: string;
    expiresIn?: number;
    OriginalName: string;
    userId?: Types.ObjectId;
    rootName?: string;
  }): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      ACL,
      Key: `${rootName}/${userId ? `${userId}/` : ''}${key}-${OriginalName}`,
      ContentType,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn });

    return { url, key: command.input.Key as string };
  }
  async getFile(key: string) {
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });

    const file = await this.s3.send(command);
    return file;
  }
  async getPresignedLink(
    key: string,
    download?: boolean,
    expiresIn = 2 * 60 * 60,
  ) {
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: download
        ? `attachment; filename="${key.split('/').at(-1)}"`
        : undefined,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn });
    return url;
  }
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });
    return await this.s3.send(command);
  }
  async getFiles(prefix: string) {
    const files = new ListObjectsV2Command({
      Bucket: env.AWS_BUCKET_NAME,
      Prefix: prefix,
    });
    return await this.s3.send(files);
  }
  async deleteFiles(keys: string[]) {
    const command = new DeleteObjectsCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });
    return await this.s3.send(command);
  }
  async deleteFolder(key: string) {
    const filesNames: { Key: string }[] =
      (await this.getFiles(key)).Contents?.map((f) => ({
        Key: f.Key as string,
      })) || [];
    const command = new DeleteObjectsCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Delete: {
        Objects: filesNames,
        Quiet: true,
      },
    });
    return await this.s3.send(command);
  }
}

export default new S3Service();
