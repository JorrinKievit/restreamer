export interface ApiError {
  status: number;
  message: string;
}

export interface DownloadApiError {
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: Date;
}
