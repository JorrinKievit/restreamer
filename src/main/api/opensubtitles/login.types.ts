export interface User {
  allowed_downloads: number;
  level: string;
  user_id: number;
  ext_installed: boolean;
  vip: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  status: number;
}
