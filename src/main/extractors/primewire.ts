import log from "electron-log";
import { GoMoviesExtractor } from "./gomovies";

export class PrimeWireExtractor extends GoMoviesExtractor {
  name = "PrimeWire";

  logger = log.scope("PrimeWire");

  url = "https://real-primewire.club";
}
