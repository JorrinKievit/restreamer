export interface UserInformationResponse {
  data: {
    allowed_downloads: number;
    allowed_translations: number;
    downloads_count: number;
    ext_installed: boolean;
    level: string;
    remaining_downloads: number;
    user_id: number;
    username: string;
    vip: boolean;
  };
}

export interface OpenSubtitlesUser {
  token: string;
  user: {
    allowed_downloads: number;
    allowed_translations: number;
    downloads_count: number;
    ext_installed: boolean;
    level: string;
    remaining_downloads: number;
    user_id: number;
    username: string;
    vip: boolean;
  };
}
