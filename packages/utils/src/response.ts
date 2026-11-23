import type { ApiResponse } from "@monorepo/shared";

export function createResponse<T>(data: T, message = "success"): ApiResponse<T> {
  return {
    code: 0,
    data,
    message,
  };
}
