import type { Permission } from "./permissions";

export const PERMISSION_DENIED_MESSAGE =
  "You don't have permission for this operation. Ask your administrator for access.";

export class PermissionDeniedError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(PERMISSION_DENIED_MESSAGE);
    this.name = "PermissionDeniedError";
    this.permission = permission;
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You must be signed in to perform this action.");
    this.name = "UnauthorizedError";
  }
}

export function isPermissionDeniedError(error: unknown): error is PermissionDeniedError {
  return error instanceof PermissionDeniedError;
}
