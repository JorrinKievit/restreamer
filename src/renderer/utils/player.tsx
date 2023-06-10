import { Box, IconButton } from '@chakra-ui/react';
import {
  MediaToggleButton,
  MediaTooltip,
  MediaTooltipProps,
} from '@vidstack/react';
import { createRoot } from 'react-dom/client';
import SyncSubtitlesIcon from 'renderer/assets/sync-subtitles-button.png';
import SubtitlesIcon from 'renderer/assets/subtitle-button.png';
import NextEpisodeIcon from 'renderer/assets/next-episode-button.png';
import { FC } from 'react';

const PlayerButton: FC<{
  id: string;
  eventName: string;
  icon: string;
  tooltipName: string;
  position: MediaTooltipProps['position'];
}> = ({ id, eventName, icon, tooltipName, position }) => {
  return (
    <MediaToggleButton
      id={id}
      onClick={() => document.dispatchEvent(new CustomEvent(eventName))}
    >
      <IconButton
        aria-label="opensubtitles"
        icon={
          <Box padding={10}>
            <img style={{ height: '100%' }} src={icon} alt="Subtitles" />
          </Box>
        }
        size="sm"
      />
      <MediaTooltip position={position}>
        <span>{tooltipName}</span>
      </MediaTooltip>
    </MediaToggleButton>
  );
};

const UploadSubtitlesButton = () => {
  return (
    <PlayerButton
      id="upload-subtitles-button"
      eventName="open-subtitles-popover"
      icon={SubtitlesIcon}
      tooltipName="Upload OpenSubtitles"
      position="bottom center"
    />
  );
};

const SyncPlayerButton = () => {
  return (
    <PlayerButton
      id="sync-subtitles-button"
      eventName="open-sync-subtitles-popover"
      icon={SyncSubtitlesIcon}
      tooltipName="Sync subtitles"
      position="bottom center"
    />
  );
};

const NextEpisodeButton = () => {
  return (
    <PlayerButton
      id="next-episode-button"
      eventName="next-episode"
      icon={NextEpisodeIcon}
      tooltipName="Next episode"
      position="top left"
    />
  );
};

export const insertPlayerButtons = (
  isOpenSubtitlesLoggedIn: boolean,
  hasNextEpisode: boolean
) => {
  const settingsMenu = document.querySelector('[part="settings-menu"]');
  if (!settingsMenu) return;

  const existingButton = document.querySelector('#sync-subtitles-button');
  const existingUploadSubtitlesButton = document.querySelector(
    '#upload-subtitles-button'
  );
  const existingNextEpisodeButton = document.querySelector(
    '#next-episode-button'
  );
  if (
    existingButton ||
    existingUploadSubtitlesButton ||
    existingNextEpisodeButton
  )
    return;

  const container = document.createElement('div');
  settingsMenu.insertBefore(container, settingsMenu.firstChild);

  const root = createRoot(container);
  root.render(<SyncPlayerButton />);

  if (isOpenSubtitlesLoggedIn) {
    const uploadSubtitlesButton = document.createElement('div');
    settingsMenu.insertBefore(uploadSubtitlesButton, settingsMenu.firstChild);

    const uploadSubtitlesRoot = createRoot(uploadSubtitlesButton);
    uploadSubtitlesRoot.render(<UploadSubtitlesButton />);
  }

  if (hasNextEpisode) {
    const controlsNodes = document.querySelectorAll('[part="controls-group"]');
    const controlsContainer = controlsNodes[controlsNodes.length - 1];
    const nextEpisodeButton = document.createElement('div');
    nextEpisodeButton.style.width = '40px';
    nextEpisodeButton.style.height = '40px';
    controlsContainer.insertBefore(
      nextEpisodeButton,
      controlsContainer.firstChild
    );

    const nextEpisodeRoot = createRoot(nextEpisodeButton);
    nextEpisodeRoot.render(<NextEpisodeButton />);
  }
};
