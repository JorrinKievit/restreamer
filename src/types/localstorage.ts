export interface PlayingData {
  [key: string]: {
    season?: number;
    episode?: number;
    playingTime: number;
    duration: number;
  };
}
