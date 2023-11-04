import { Box, IconButton } from '@chakra-ui/react';
import { OPENSUBTITLES_LANGUAGES } from 'main/api/opensubtitles/languages';
import { randomString } from 'main/extractors/utils';
import { FC } from 'react';
import { createRoot } from 'react-dom/client';
import { Subtitle } from 'types/sources';

import SyncSubtitlesIcon from 'renderer/assets/sync-subtitles-button.png';
import SubtitlesIcon from 'renderer/assets/subtitle-button.png';
import NextEpisodeIcon from 'renderer/assets/next-episode-button.png';
import { Tooltip, TooltipPlacement } from '@vidstack/react';

export const getSubtitlePlayerLanguage = (subtitle: Subtitle, languageCounts: { [key: string]: number }) => {
  let language = OPENSUBTITLES_LANGUAGES.find((lang) => lang.language_name.includes(subtitle.label.split(' ')[0].trim()));

  if (!language) {
    language = {
      language_name: subtitle.label,
      language_code: randomString(2),
    };
  }

  if (!languageCounts[language.language_name]) {
    languageCounts[language.language_name] = 0;
  }
  const count = languageCounts[language.language_name] + 1;
  languageCounts[language.language_name] = count;

  return {
    name: language.language_name,
    code: language.language_code,
    count,
  };
};

const PlayerButton: FC<{
  id: string;
  eventName: string;
  icon: string;
  tooltipName: string;
  placement: TooltipPlacement;
}> = ({ id, eventName, icon, tooltipName, placement }) => {
  return (
    <Tooltip.Root showDelay={100}>
      <Tooltip.Trigger asChild>
        <IconButton
          id={id}
          onClick={() => {
            document.dispatchEvent(new Event(eventName));
          }}
          className="vds-play-button vds-button"
          aria-label="opensubtitles"
          icon={
            <Box padding={10}>
              <img style={{ height: '100%' }} src={icon} alt="Subtitles" />
            </Box>
          }
          size="sm"
        />
      </Tooltip.Trigger>
      <Tooltip.Content placement={placement} className="vds-tooltip-content">
        {tooltipName}
      </Tooltip.Content>
    </Tooltip.Root>
  );
};

const UploadSubtitlesButton = () => {
  return <PlayerButton id="upload-subtitles-button" eventName="open-subtitles-popover" icon={SubtitlesIcon} tooltipName="Upload OpenSubtitles" placement="bottom center" />;
};

const SyncPlayerButton = () => {
  return <PlayerButton id="sync-subtitles-button" eventName="open-sync-subtitles-popover" icon={SyncSubtitlesIcon} tooltipName="Sync subtitles" placement="bottom center" />;
};

const NextEpisodeButton = () => {
  return <PlayerButton id="next-episode-button" eventName="next-episode" icon={NextEpisodeIcon} tooltipName="Next episode" placement="top start" />;
};

export const insertPlayerButtons = (isOpenSubtitlesLoggedIn: boolean, hasNextEpisode: boolean) => {
  const controlsContainer = document.querySelector('.vds-controls');
  if (!controlsContainer) return;

  const existingButton = document.querySelector('#sync-subtitles-button');
  const existingUploadSubtitlesButton = document.querySelector('#upload-subtitles-button');
  const existingNextEpisodeButton = document.querySelector('#next-episode-button');
  if (existingButton || existingUploadSubtitlesButton || existingNextEpisodeButton) return;

  const container = document.createElement('div');
  container.className = 'vds-controls-group';
  container.style.pointerEvents = 'auto';
  controlsContainer.prepend(container);

  const syncSubtitlesButton = document.createElement('div');
  container.append(syncSubtitlesButton);
  const syncSubtitlesRoot = createRoot(syncSubtitlesButton);
  syncSubtitlesRoot.render(<SyncPlayerButton />);

  if (isOpenSubtitlesLoggedIn) {
    const uploadSubtitlesButton = document.createElement('div');
    container.append(uploadSubtitlesButton);

    const uploadSubtitlesRoot = createRoot(uploadSubtitlesButton);
    uploadSubtitlesRoot.render(<UploadSubtitlesButton />);
  }

  if (hasNextEpisode) {
    const controlsNodes = document.querySelectorAll('.vds-controls-group');
    const controlGroupContainer = controlsNodes[controlsNodes.length - 1];
    const nextEpisodeButton = document.createElement('div');
    nextEpisodeButton.style.width = '40px';
    nextEpisodeButton.style.height = '40px';
    controlGroupContainer.prepend(nextEpisodeButton);

    const nextEpisodeRoot = createRoot(nextEpisodeButton);
    nextEpisodeRoot.render(<NextEpisodeButton />);
  }
};
