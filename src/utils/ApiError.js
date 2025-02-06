class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message); // Call the parent constructor with the message
    this.statusCode = statusCode;
    this.data = null; // Optional: you can keep or remove this if unused
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack; // Use provided stack if available
    } else {
      Error.captureStackTrace(this, this.constructor); // Generate stack trace
    }
  }
}

export { ApiError };
