export interface Result {
  server: string;
  title: string;
  quality: string;
  size: number;
  exact_match: number;
  url: string;
}

export interface SuperEmbedResults {
  message: string;
  status: number;
  title: string;
  results: Result[];
}
