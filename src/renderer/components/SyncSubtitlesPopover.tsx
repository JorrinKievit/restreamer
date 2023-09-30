import {
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  useDisclosure,
} from '@chakra-ui/react';
import { useMediaPlayer, useMediaStore } from '@vidstack/react';
import { useEffect, useState } from 'react';

export const SyncSubtitlesPopover = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [value, setValue] = useState(0);

  const player = useMediaPlayer();
  const store = useMediaStore();

  useEffect(() => {
    document.addEventListener('open-sync-subtitles-popover', () => {
      if (!isOpen) onOpen();
    });
    return () => {
      document.removeEventListener('open-sync-subtitles-popover', () => {
        if (isOpen) onClose();
      });
    };
  }, [isOpen, onClose, onOpen]);

  const handleSyncSubtitleChange = () => {
    if (!player) {
      onClose();
      return;
    }
    const track = store.textTrack;
    if (!track || !track.src) {
      onClose();
      return;
    }

    track.cues.forEach((cue) => {
      cue.startTime += value / 1000;
      cue.endTime += value / 1000;
    });

    onClose();
  };

  useEffect(() => {
    if (isOpen) player?.controls.pause();
    if (!isOpen) player?.controls.resume();
  }, [isOpen, player?.controls]);

  return (
    <Popover isOpen={isOpen} onClose={onClose} placement="bottom" id="sync-subtitles-popover">
      <PopoverContent
        sx={{
          marginTop: '50px',
          width: '450px',
          left: '10px',
        }}
      >
        <PopoverHeader>Sync Subtitles</PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <FormControl isRequired>
            <FormLabel>
              {/* eslint-disable no-nested-ternary */}
              {value === 0
                ? 'No subtitle delay'
                : value > 0
                ? `Use this if the subtitles are shown ${value}ms too early`
                : `Use this if the subtitles are shown ${value.toString().replace('-', '')}ms too late`}
            </FormLabel>
            <NumberInput onChange={(v) => (Number.isNaN(parseInt(v, 10)) ? setValue(0) : setValue(parseInt(v, 10)))} value={value} placeholder="-100 or 100" step={100}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </PopoverBody>
        <PopoverFooter>
          <ButtonGroup w="full" justifyContent="end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" mr={3} onClick={handleSyncSubtitleChange}>
              Sync
            </Button>
          </ButtonGroup>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};

export default SyncSubtitlesPopover;
