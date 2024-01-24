class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    statch = ""
  ) {
    super(message);
    this.statuscode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (statch) {
      this.stack = statch;
    } else {
      Error.captureStackTrace(this, this.contructor);
    }
  }
}

export { ApiError };
