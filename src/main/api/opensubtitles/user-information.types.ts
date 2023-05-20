export interface UserInformationResponse {
  data: {
    allowed_downloads: number;
    level: string;
    user_id: number;
    ext_installed: boolean;
    vip: boolean;
    downloads_count: number;
    remaining_downloads: number;
  };
}

export interface OpenSubtitlesUser {
  token: string;
  user: {
    allowed_downloads: number;
    ext_installed: boolean;
    level: string;
    remaining_downloads: number;
    user_id: number;
    vip: boolean;
  };
}
