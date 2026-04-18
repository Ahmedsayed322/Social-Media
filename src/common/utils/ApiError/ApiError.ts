export class ApiError extends Error {
  constructor(
    public error: any,
    public statusCode: number,
  ) {
    super(error);
    this.message = error;
  }
}
