import { APITypes } from 'plyr-react';
import SubtitlesButton from 'renderer/assets/subtitle-button.png';
import SyncSubtitlesButton from 'renderer/assets/sync-subtitles-button.png';
import NextEpisodeButton from 'renderer/assets/next-episode-button.png';
import { ContentType } from 'types/tmbd';

export const insertPlayerButtons = (
  ref: APITypes,
  type: ContentType,
  isLastEpisode?: boolean
) => {
  const captionsButton = document.querySelector('[data-plyr="captions"]');
  const playButton = document.querySelector('[data-plyr="play"]');
  if (!captionsButton || !playButton) return;
  if (document.querySelector('[data-plyr="subtitles"]')) return;
  if (document.querySelector('[data-plyr="sync-subtitles"]')) return;
  if (document.querySelector('[data-plyr="next-episode"]')) return;

  const subtitlesButton = document.createElement('a');
  subtitlesButton.className =
    'plyr__controls__item plyr__control plyr__control--pressed subtitles__button';
  subtitlesButton.style.height = '32px';
  subtitlesButton.style.display = 'inline-block';
  subtitlesButton.setAttribute('data-plyr', 'subtitles');
  subtitlesButton.onclick = () => {
    if (ref.plyr.fullscreen.active) ref.plyr.fullscreen.exit();
    const event = new CustomEvent('open-subtitles-modal');
    document.dispatchEvent(event);
  };
  const subtitlesImage = document.createElement('img');
  subtitlesImage.src = SubtitlesButton;
  subtitlesImage.alt = 'Subtitles';
  subtitlesImage.style.width = '100%';
  subtitlesImage.style.height = '100%';

  const subtitlesTooltip = document.createElement('span');
  subtitlesTooltip.className = 'plyr__tooltip';
  subtitlesTooltip.innerText = 'Add OpenSubtitles.com subtitle';

  subtitlesButton.appendChild(subtitlesImage);
  subtitlesButton.appendChild(subtitlesTooltip);
  captionsButton.parentNode!.insertBefore(
    subtitlesButton,
    captionsButton.nextSibling
  );

  const syncSubtitlesButton = document.createElement('a');
  syncSubtitlesButton.className =
    'plyr__controls__item plyr__control plyr__control--pressed sync__subtitles__button';
  syncSubtitlesButton.style.height = '32px';
  syncSubtitlesButton.style.display = 'inline-block';
  syncSubtitlesButton.setAttribute('data-plyr', 'subtitles');
  syncSubtitlesButton.onclick = () => {
    if (ref.plyr.fullscreen.active) ref.plyr.fullscreen.exit();
    const event = new CustomEvent('open-sync-subtitles-modal');
    document.dispatchEvent(event);
  };
  const syncSubtitlesImage = document.createElement('img');
  syncSubtitlesImage.src = SyncSubtitlesButton;
  syncSubtitlesImage.alt = 'Sync Subtitles';
  syncSubtitlesImage.style.width = '100%';
  syncSubtitlesImage.style.height = '100%';

  const syncSubtitlesTooltip = document.createElement('span');
  syncSubtitlesTooltip.className = 'plyr__tooltip';
  syncSubtitlesTooltip.innerText = 'Sync subtitles';

  syncSubtitlesButton.appendChild(syncSubtitlesImage);
  syncSubtitlesButton.appendChild(syncSubtitlesTooltip);
  captionsButton.parentNode!.insertBefore(
    syncSubtitlesButton,
    subtitlesButton.nextSibling
  );

  if (type === 'tv' && !isLastEpisode) {
    const nextEpisodeButton = document.createElement('a');
    nextEpisodeButton.className =
      'plyr__controls__item plyr__control plyr__control--pressed sync__subtitles__button';
    nextEpisodeButton.style.height = '32px';
    nextEpisodeButton.style.display = 'inline-block';
    nextEpisodeButton.setAttribute('data-plyr', 'next-episode');
    nextEpisodeButton.onclick = () => {
      // if (ref.plyr.fullscreen.active) ref.plyr.fullscreen.exit();
      const event = new CustomEvent('next-episode');
      document.dispatchEvent(event);
    };
    const nextEpisodeImage = document.createElement('img');
    nextEpisodeImage.src = NextEpisodeButton;
    nextEpisodeImage.alt = 'Next Episode';
    nextEpisodeImage.style.width = '100%';
    nextEpisodeImage.style.height = '100%';

    const nextEpisodeTooltip = document.createElement('span');
    nextEpisodeTooltip.className = 'plyr__tooltip';
    nextEpisodeTooltip.innerText = 'Next Episode';

    nextEpisodeButton.appendChild(nextEpisodeImage);
    nextEpisodeButton.appendChild(nextEpisodeTooltip);
    playButton.parentNode!.insertBefore(
      nextEpisodeButton,
      playButton.nextSibling
    );
  }
};
