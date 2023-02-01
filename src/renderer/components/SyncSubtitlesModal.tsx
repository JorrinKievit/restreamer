import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  useDisclosure,
} from '@chakra-ui/react';
import { useSyncSubtitle } from 'renderer/api/opensubtitles/api';
import React, { FC, useEffect, useState } from 'react';

const SyncSubtitlesModal: FC = () => {
  const { mutate, data, error, isLoading } = useSyncSubtitle();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [value, setValue] = useState(0);
  const format = (val: number) => `${val}ms`;
  const parse = (val: string) => val.replace(/^\$/, '');

  useEffect(() => {
    document.addEventListener('open-sync-subtitles-modal', () => {
      if (!isOpen) onOpen();
    });
    return () => {
      document.removeEventListener('open-sync-subtitles-modal', () => {
        if (isOpen) onClose();
      });
    };
  }, [isOpen, onClose, onOpen]);

  const handleSyncSubtitleChange = () => {
    const track = document.querySelector('track[default]');
    if (!track) return;
    mutate(
      {
        downloadUrl: track.getAttribute('src') as string,
        timeShift: value,
      },
      {
        onSuccess: (url) => {
          track.setAttribute('src', url);
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sync Subtitles</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Timeshift in ms</FormLabel>
            <NumberInput
              onChange={(v) => setValue(Number(parse(v)))}
              value={format(value)}
              placeholder="-1 or 1"
            >
              <NumberInputField />
            </NumberInput>
            {error ? (
              <FormErrorMessage>{error.toString()}</FormErrorMessage>
            ) : null}
          </FormControl>
        </ModalBody>
        <ModalFooter gap={4}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSyncSubtitleChange}
            isLoading={isLoading}
          >
            Sync
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SyncSubtitlesModal;
