import { APITypes } from 'plyr-react';
import SubtitlesButton from 'renderer/assets/subtitle-button.png';
import SyncSubtitlesButton from 'renderer/assets/sync-subtitles-button.png';
import NextEpisodeButton from 'renderer/assets/next-episode-button.png';
import { ContentType } from 'types/tmbd';

type ButtonType = 'subtitles' | 'sync-subtitles' | 'next-episode';

const createButton = (
  ref: APITypes,
  type: ButtonType,
  tooltipText: string,
  imageSrc: string,
  altText: string,
  onClickHandler: () => void
) => {
  const existingButton = document.querySelector(`[data-plyr="${type}"]`);
  if (existingButton) return;

  const button = document.createElement('a');
  button.className = `plyr__controls__item plyr__control plyr__control--pressed ${type}__button`;
  button.style.height = '32px';
  button.style.display = 'inline-block';
  button.setAttribute('data-plyr', type);
  button.onclick = () => {
    if (ref.plyr.fullscreen.active) ref.plyr.fullscreen.exit();
    onClickHandler();
  };

  const image = document.createElement('img');
  image.src = imageSrc;
  image.alt = altText;
  image.style.width = '100%';
  image.style.height = '100%';

  const tooltip = document.createElement('span');
  tooltip.className = 'plyr__tooltip';
  tooltip.innerText = tooltipText;

  button.appendChild(image);
  button.appendChild(tooltip);

  return button;
};

export const insertPlayerButtons = (
  ref: APITypes,
  type: ContentType,
  hasOpenSubtitles: boolean,
  hasSubtitles: boolean,
  isLastEpisode?: boolean
) => {
  const captionsButton = document.querySelector('[data-plyr="captions"]');
  const playButton = document.querySelector('[data-plyr="play"]');
  if (!captionsButton || !playButton) return;

  let subtitlesButton: HTMLAnchorElement | undefined;

  if (hasOpenSubtitles) {
    subtitlesButton = createButton(
      ref,
      'subtitles',
      'Add OpenSubtitles.com subtitle',
      SubtitlesButton,
      'Subtitles',
      () => document.dispatchEvent(new CustomEvent('open-subtitles-modal'))
    );
    if (subtitlesButton) {
      captionsButton.parentNode!.insertBefore(
        subtitlesButton,
        captionsButton.nextSibling
      );
    }
  }

  if (hasSubtitles || hasOpenSubtitles) {
    const syncSubtitlesButton = createButton(
      ref,
      'sync-subtitles',
      'Sync subtitles',
      SyncSubtitlesButton,
      'Sync Subtitles',
      () => document.dispatchEvent(new CustomEvent('open-sync-subtitles-modal'))
    );
    if (syncSubtitlesButton) {
      captionsButton.parentNode!.insertBefore(
        syncSubtitlesButton,
        subtitlesButton
          ? subtitlesButton.nextSibling
          : captionsButton.nextSibling
      );
    }
  }

  if (type === 'tv' && !isLastEpisode) {
    const nextEpisodeButton = createButton(
      ref,
      'next-episode',
      'Next Episode',
      NextEpisodeButton,
      'Next Episode',
      () => document.dispatchEvent(new CustomEvent('next-episode'))
    );
    if (nextEpisodeButton) {
      playButton.parentNode!.insertBefore(
        nextEpisodeButton,
        playButton.nextSibling
      );
    }
  }
};
