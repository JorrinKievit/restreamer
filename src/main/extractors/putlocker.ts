import log from 'electron-log';
import { GoMoviesExtractor } from './gomovies';

export class PutLockerExtractor extends GoMoviesExtractor {
  name = 'PutLocker';

  logger = log.scope(this.name);

  url = 'https://putlocker.actor';
}
