import { ipcMain } from 'electron';
import { Sources } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { VidSrcExtractor } from '../extractors/vidsrc';
import { TwoEmbedExtractor } from '../extractors/2embed';
import { SuperStreamExtractor } from '../extractors/superstream/superstream';

ipcMain.handle(
  'get-sources',
  async (
    event,
    imdbId,
    showName,
    type: ContentType,
    season?: number,
    episode?: number
  ) => {
    const superStreamExtractor = new SuperStreamExtractor();
    const twoEmbedExtractor = new TwoEmbedExtractor();
    const vidSrcExtractor = new VidSrcExtractor();

    const superStreamSources = await superStreamExtractor.extractUrls(
      showName,
      type,
      season,
      episode
    );

    const twoEmbedSources = await twoEmbedExtractor.extractUrls(
      imdbId,
      type,
      season,
      episode
    );

    const vidSrcSources = await vidSrcExtractor.extractUrls(
      imdbId,
      type,
      season,
      episode
    );

    const sources = [
      ...superStreamSources,
      ...twoEmbedSources,
      ...vidSrcSources,
    ] as Sources;

    return sources;
  }
);
