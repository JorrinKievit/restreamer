/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import {
  useDownloadSubtitle,
  useSearchSubtitles,
} from 'renderer/api/opensubtitles/api';
import { OPENSUBTITLES_LANGUAGES } from 'renderer/api/opensubtitles/languages';
import { OpenSubtitlesUser } from 'renderer/api/opensubtitles/user-information.types';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';

interface SubtitleSelectorProps {
  tmbdId: string;
  season?: number;
  episode?: number;
}

export const SubtitleSelector: FC<SubtitleSelectorProps> = ({
  tmbdId,
  season,
  episode,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [language, setLanguage] = useState('');
  const [fileId, setFileId] = useState('');
  const [opensubtitlesData, setOpensubtitlesData] =
    useLocalStorage<OpenSubtitlesUser | null>('opensubtitles', null);

  const {
    data,
    error: searchError,
    isLoading: searchIsLoading,
  } = useSearchSubtitles(tmbdId, isOpen, season, episode);
  const {
    mutate,
    error: downloadError,
    isLoading: downloadIsLoading,
  } = useDownloadSubtitle();

  useEffect(() => {
    document.addEventListener('open-subtitles-modal', () => {
      if (!isOpen) onOpen();
    });
    return () => {
      document.removeEventListener('open-subtitles-modal', () => {
        if (isOpen) onClose();
      });
    };
  }, [isOpen, onClose, onOpen]);

  useEffect(() => {
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
            )?.language_name,
            srclang: language,
            default: true,
            src: res.link,
          });
          video?.appendChild(track);

          setOpensubtitlesData({
            ...opensubtitlesData!,
            user: {
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Subtitle selector</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Skeleton isLoaded={!searchIsLoading}>
            <VStack spacing={4}>
              <Select
                placeholder="Select a language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
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
                  .sort((a, b) =>
                    a!.language_name > b!.language_name ? 1 : -1
                  )
                  .map((lang) => (
                    <option
                      key={lang?.language_code}
                      value={lang?.language_code}
                    >
                      {lang?.language_name}
                    </option>
                  ))}
              </Select>
              <Select
                placeholder="Select a file"
                value={fileId}
                disabled={language === ''}
                onChange={(e) => setFileId(e.target.value)}
              >
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
              </Select>
            </VStack>
          </Skeleton>
        </ModalBody>
        <ModalFooter gap={4}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSubtitleChange}
            isDisabled={fileId === ''}
            isLoading={downloadIsLoading}
          >
            Select
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
