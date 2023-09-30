import { Button, ButtonGroup, Popover, PopoverBody, PopoverCloseButton, PopoverContent, PopoverFooter, PopoverHeader, Select, Skeleton, useDisclosure, VStack } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { OPENSUBTITLES_LANGUAGES } from 'main/api/opensubtitles/languages';
import { OpenSubtitlesUser } from 'main/api/opensubtitles/user-information.types';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { client } from 'renderer/api/trpc';
import { useMediaPlayer, useMediaRemote, useMediaStore } from '@vidstack/react';

interface SubtitleSelectorProps {
  tmdbId: string;
  season?: number;
  episode?: number;
}

export const SubtitleSelector: FC<SubtitleSelectorProps> = ({ tmdbId, season, episode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [language, setLanguage] = useState('');
  const [fileId, setFileId] = useState('');
  const [opensubtitlesData, setOpensubtitlesData] = useLocalStorage<OpenSubtitlesUser | null>('opensubtitles', null);

  const { data, isLoading: searchIsLoading } = client.opensubtitles.search.useQuery(
    {
      tmdbId,
      season,
      episode,
    },
    {
      enabled: !!isOpen,
    }
  );
  const { mutate, isLoading: downloadIsLoading } = client.opensubtitles.download.useMutation();

  const player = useMediaPlayer();
  const store = useMediaStore();
  const remote = useMediaRemote();

  useEffect(() => {
    document.addEventListener('open-subtitles-popover', () => {
      if (!isOpen) onOpen();
    });
    return () => {
      document.removeEventListener('open-subtitles-popover', () => {
        if (isOpen) onClose();
      });
    };
  }, [isOpen, onClose, onOpen]);

  useEffect(() => {
    setFileId('');
  }, [language]);

  useEffect(() => {
    if (isOpen) remote.toggleControls();
  }, [isOpen, remote]);

  const handleSubtitleChange = () => {
    mutate(
      { fileId: Number(fileId), token: opensubtitlesData!.token },
      {
        onSuccess: (res) => {
          if (!player || !store) return;

          const existingTextTracks = player.textTracks;
          const languageTracksCount = Array.from(existingTextTracks).filter((track) => track?.language === language).length;

          let label = `Uploaded | ${OPENSUBTITLES_LANGUAGES.find((l) => l.language_code === language)?.language_name}`;

          if (languageTracksCount > 0) label += ` ${languageTracksCount + 1}`;

          player.textTracks.add({
            src: res.link,
            kind: 'subtitles',
            label,
            language,
            default: true,
          });
          player.textTracks[player.textTracks.length - 1]!.mode = 'showing';

          setOpensubtitlesData({
            ...opensubtitlesData!,
            user: {
              // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
              ...opensubtitlesData?.user!,
              remaining_downloads: res.remaining,
            },
          });
          onClose();
        },
      }
    );
  };

  return (
    <Popover isOpen={isOpen} onClose={onClose}>
      <PopoverContent
        sx={{
          marginTop: '10px',
          left: player?.state.fullscreen ? '450%' : '240%',
        }}
      >
        <PopoverHeader>Subtitle selector</PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Skeleton isLoaded={!searchIsLoading}>
            <VStack spacing={4}>
              <Select placeholder="Select a language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {[
                  ...new Set(
                    data
                      ?.filter((subtitle) => subtitle.attributes.language !== null)
                      .map((subtitle: { attributes: { language: string } }) => OPENSUBTITLES_LANGUAGES.find((l) => subtitle.attributes.language.toLowerCase() === l.language_code))
                  ),
                ]
                  .sort((a, b) => (a!.language_name > b!.language_name ? 1 : -1))
                  .map((lang) => (
                    <option key={lang?.language_code} value={lang?.language_code}>
                      {lang?.language_name}
                    </option>
                  ))}
              </Select>
              <Select placeholder="Select a file" value={fileId} disabled={language === ''} onChange={(e) => setFileId(e.target.value)}>
                {data
                  ?.filter((subtitle) => subtitle.attributes.language?.toLowerCase() === language)
                  ?.sort((a, b) => b.attributes.download_count - a.attributes.download_count)
                  .map((subtitle, i) => (
                    <option
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${subtitle.attributes.files[0].file_id}-${i}`}
                      value={subtitle.attributes.files[0].file_id}
                    >
                      {subtitle.attributes.files[0].file_name} | Downloads: {subtitle.attributes.download_count}
                    </option>
                  ))}
              </Select>
            </VStack>
          </Skeleton>
        </PopoverBody>
        <PopoverFooter alignItems="right">
          <ButtonGroup w="full" justifyContent="end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" mr={3} onClick={handleSubtitleChange} isDisabled={fileId === ''} isLoading={downloadIsLoading}>
              Select
            </Button>
          </ButtonGroup>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};
