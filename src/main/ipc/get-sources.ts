import { ipcMain } from 'electron';
import { Sources } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { VidSrcExtractor } from '../extractors/vidsrc';
import { TwoEmbedExtractor } from '../extractors/2embed';

ipcMain.handle(
  'get-sources',
  async (event, id, type: ContentType, season?: number, episode?: number) => {
    const twoEmbedSources = await TwoEmbedExtractor.extractUrls(
      id,
      type,
      season,
      episode
    );

    const vidSrcSources = await VidSrcExtractor.extractUrls(
      id,
      type,
      season,
      episode
    );
    const sources = twoEmbedSources.concat(vidSrcSources) as Sources;

    return sources;
  }
);
