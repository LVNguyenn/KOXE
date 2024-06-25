const STATUS_CODES = {
    OK: 200,
    BAD_REQUEST: 400,
    UN_AUTHORISED: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  } as const;
  
  class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errorStack: boolean;
    logError: any;
  
    constructor(
      public name: string,
      statusCode: number,
      description: string,
      isOperational: boolean,
      errorStack: boolean,
      logingErrorResponse: any
    ) {
      super(description);
      Object.setPrototypeOf(this, new.target.prototype);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      this.errorStack = errorStack;
      this.logError = logingErrorResponse;
      Error.captureStackTrace(this);
    }
  }
  
  //api Specific Errors
  class APIError extends AppError {
    constructor(
      name: string,
      statusCode: number = STATUS_CODES.INTERNAL_ERROR,
      description: string = "Internal Server Error",
      isOperational: boolean = true
    ) {
      super(name, statusCode, description, isOperational, false, null);
    }
  }
  
  //400
  class BadRequestError extends AppError {
    constructor(description: string = "Bad request", logingErrorResponse: any) {
      super(
        "NOT FOUND",
        STATUS_CODES.BAD_REQUEST,
        description,
        true,
        false,
        logingErrorResponse
      );
    }
  }
  
  //400
  class ValidationError extends AppError {
    constructor(description: string = "Validation Error", errorStack: boolean) {
      super(
        "BAD REQUEST",
        STATUS_CODES.BAD_REQUEST,
        description,
        true,
        errorStack,
        null
      );
    }
  }
  
  export {
    AppError,
    APIError,
    BadRequestError,
    ValidationError,
    STATUS_CODES,
  };