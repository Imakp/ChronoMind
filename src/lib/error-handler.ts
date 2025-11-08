import { ZodError } from "zod";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

/**
 * Handles errors from server actions and returns a consistent error response
 */
export function handleActionError(error: unknown): ActionResult {
  console.error("Action error:", error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    error.issues.forEach((err) => {
      const path = err.path.join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(err.message);
    });

    return {
      success: false,
      error: "Validation failed",
      errors: fieldErrors,
    };
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;

    switch (prismaError.code) {
      case "P2002":
        return {
          success: false,
          error: "A record with this information already exists",
        };
      case "P2025":
        return {
          success: false,
          error: "Record not found",
        };
      case "P2003":
        return {
          success: false,
          error: "Related record not found",
        };
      case "P2014":
        return {
          success: false,
          error: "Invalid relationship",
        };
      default:
        return {
          success: false,
          error: "Database operation failed",
        };
    }
  }

  // Handle standard errors
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }

  // Handle unknown errors
  return {
    success: false,
    error: "An unexpected error occurred",
  };
}

/**
 * Wraps a server action with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<ActionResult<R>>
): (...args: T) => Promise<ActionResult<R>> {
  return async (...args: T): Promise<ActionResult<R>> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleActionError(error);
    }
  };
}

/**
 * User-friendly error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
  SERVER: "Server error. Please try again later.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
} as const;

/**
 * Gets a user-friendly error message
 */
export function getUserFriendlyError(error: string | undefined): string {
  if (!error) return ERROR_MESSAGES.UNKNOWN;

  // Map technical errors to user-friendly messages
  if (error.includes("network") || error.includes("fetch")) {
    return ERROR_MESSAGES.NETWORK;
  }
  if (error.includes("unauthorized") || error.includes("forbidden")) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  if (error.includes("not found")) {
    return ERROR_MESSAGES.NOT_FOUND;
  }
  if (error.includes("validation")) {
    return ERROR_MESSAGES.VALIDATION;
  }

  return error;
}
