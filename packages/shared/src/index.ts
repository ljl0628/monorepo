export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
