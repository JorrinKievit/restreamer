/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { FC, useEffect, useState } from 'react';
import {
  useDownloadSubtitle,
  useSearchSubtitles,
} from 'renderer/api/opensubtitles/api';
import { OPENSUBTITLES_LANGUAGES } from 'renderer/api/opensubtitles/languages';
import { OpenSubtitlesUser } from 'renderer/api/opensubtitles/user-information.types';
import SubtitlesButton from 'renderer/assets/subtitle-button.png';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';

interface SubtitleSelectorProps {
  tmbdId: string;
  season?: number;
  number?: number;
}

export const SubtitleSelector: FC<SubtitleSelectorProps> = ({
  tmbdId,
  season,
  number,
}) => {
  const [language, setLanguage] = useState('');
  const [fileId, setFileId] = useState('');
  const [isSelected, setIsSelected] = useState(false);
  const [opensubtitlesData, setOpensubtitlesData] =
    useLocalStorage<OpenSubtitlesUser>('opensubtitles', null);

  const {
    data,
    error: searchError,
    isLoading: searchIsLoading,
  } = useSearchSubtitles(tmbdId, season, number);
  const {
    mutate,
    error: downloadError,
    isLoading: downloadIsLoading,
  } = useDownloadSubtitle();

  useEffect(() => {
    setIsSelected(true);
    setFileId('');
  }, [language]);

  const handleSubtitleChange = () => {
    mutate(
      { fileId: Number(fileId) },
      {
        onSuccess: (res) => {
          const video = document.querySelector('video');
          const tracks = document.querySelectorAll('track');
          tracks.forEach((track) => {
            if (track.srclang === language) track.remove();
            track.removeAttribute('default');
          });
          const track = document.createElement('track');
          if (!track) return;
          Object.assign(track, {
            kind: 'subtitles',
            label: OPENSUBTITLES_LANGUAGES.find(
              (l) => l.language_code === language
            ).language_name,
            srclang: language,
            default: true,
            src: res.link,
          });
          video.appendChild(track);

          setOpensubtitlesData({
            ...opensubtitlesData,
            user: {
              ...opensubtitlesData.user,
              remaining_downloads: res.remaining,
            },
          });
        },
      }
    );
  };

  return (
    <div className="modal" id="subtitle-modal">
      <div className="modal-box">
        {searchIsLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg">Subtitle selector</h3>
              <select
                className="select select-bordered w-full"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option disabled value="">
                  Select a language
                </option>
                {[
                  ...new Set(
                    data
                      ?.filter(
                        (subtitle) => subtitle.attributes.language !== null
                      )
                      .map((subtitle) =>
                        OPENSUBTITLES_LANGUAGES.find(
                          (l) =>
                            subtitle.attributes.language.toLowerCase() ===
                            l.language_code
                        )
                      )
                  ),
                ]
                  .sort((a, b) => (a.language_name > b.language_name ? 1 : -1))
                  .map((lang) => (
                    <option
                      key={lang?.language_code}
                      value={lang?.language_code}
                    >
                      {lang?.language_name}
                    </option>
                  ))}
              </select>

              <select
                className="select select-bordered w-full"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
              >
                <option disabled selected={isSelected} value="">
                  Select a file
                </option>
                {data
                  ?.filter(
                    (subtitle) =>
                      subtitle.attributes.language?.toLowerCase() === language
                  )
                  ?.sort(
                    (a, b) =>
                      b.attributes.download_count - a.attributes.download_count
                  )
                  .map((subtitle, i) => (
                    <option
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${subtitle.attributes.files[0].file_id}-${i}`}
                      value={subtitle.attributes.files[0].file_id}
                    >
                      {subtitle.attributes.files[0].file_name} -{' '}
                      {subtitle.attributes.language} -{' '}
                      {subtitle.attributes.download_count}
                    </option>
                  ))}
              </select>
            </div>
            <div className="modal-action">
              <a href="#" className="btn btn-secondary">
                Cancel
              </a>
              <a
                href="#"
                className="btn btn-primary"
                onClick={handleSubtitleChange}
              >
                Select
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const InsertSubtitleButton = () => {
  const captionsButton = document.querySelector('[data-plyr="captions"]');
  console.log(captionsButton);
  if (!captionsButton) return;
  const button = document.createElement('a');
  button.className =
    'plyr__controls__item plyr__control plyr__control--pressed subtitles_button inline-block h-[32px]';
  button.setAttribute('data-plyr', 'subtitles');
  button.href = '#subtitle-modal';
  const image = document.createElement('img');
  image.src = SubtitlesButton;
  image.alt = 'Subtitles';
  image.className = 'h-full w-full';
  button.appendChild(image);
  captionsButton.parentNode.insertBefore(button, captionsButton.nextSibling);
};
