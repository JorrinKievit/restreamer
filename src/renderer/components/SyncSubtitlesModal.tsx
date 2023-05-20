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
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useDisclosure,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { useSyncSubtitle } from 'renderer/lib/subtitles';

const SyncSubtitlesModal: FC = () => {
  const { mutate, error, isLoading } = useSyncSubtitle();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [value, setValue] = useState(0);

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
    const selectedLanguage = document
      .querySelector('[data-plyr="language"][aria-checked="true"]')
      ?.querySelector('.plyr__badge');
    const track = document.querySelector(
      `track[srclang="${selectedLanguage?.textContent?.toLowerCase()}"]`
    );
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
            <FormLabel>
              {/* eslint-disable no-nested-ternary */}
              {value === 0
                ? 'No subtitle delay'
                : value > 0
                ? `Use this if the subtitles are shown ${value}ms too early`
                : `Use this if the subtitles are shown ${value
                    .toString()
                    .replace('-', '')}ms too late`}
            </FormLabel>
            <NumberInput
              onChange={(v) =>
                Number.isNaN(parseInt(v, 10))
                  ? setValue(0)
                  : setValue(parseInt(v, 10))
              }
              value={value}
              placeholder="-100 or 100"
              step={100}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
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
