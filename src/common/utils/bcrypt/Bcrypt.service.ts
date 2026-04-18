import bcrypt from 'bcrypt';

class BcryptService {
  constructor() {}
  static async hash(data: string): Promise<string> {
    return await bcrypt.hash(data, 10);
  }
  static async compare(PT: string, CT: string): Promise<boolean> {
    return await bcrypt.compare(PT, CT);
  }
}

export default BcryptService;
