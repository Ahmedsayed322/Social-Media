export class ApiError extends Error {
  constructor(
    public error: string,
    public statusCode: number,
  ) {
    super(error);
    this.message = error;
  }
}
