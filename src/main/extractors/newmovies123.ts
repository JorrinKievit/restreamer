import log from "electron-log";
import { GoMoviesExtractor } from "./gomovies";

export class NewMovies123Extractor extends GoMoviesExtractor {
  name = "NewMovies123";

  logger = log.scope(this.name);

  url = "https://new-movies123.link";
}
