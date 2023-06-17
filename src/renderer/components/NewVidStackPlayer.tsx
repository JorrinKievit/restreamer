import { SettingsIcon } from '@chakra-ui/icons';
import { Box, Flex, Spacer, Text } from '@chakra-ui/react';
import {
  MediaPlayer,
  MediaOutlet,
  MediaPlayButton,
  MediaMuteButton,
  MediaVolumeSlider,
  MediaTimeSlider,
  MediaTime,
  MediaCaptionButton,
  MediaFullscreenButton,
  MediaMenu,
  MediaMenuButton,
  MediaMenuItems,
  MediaRadioGroup,
  MediaSliderValue,
} from '@vidstack/react';
import React, { FC, useEffect, useRef, useState } from 'react';
import { MediaPlayerElement } from 'vidstack';

const NewVidStackPlayer: FC = () => {
  const player = useRef<MediaPlayerElement>(null);

  const [mainTitle, setMainTitle] = useState('');

  useEffect(() => {
    if (!player.current) return;
    setMainTitle(player.current.title);
  }, []);

  return (
    <MediaPlayer ref={player} title="Agent 327: Operation Barbershop" src="https://media-files.vidstack.io/720p.mp4" poster="https://media-files.vidstack.io/poster.png" aspectRatio={16 / 9}>
      <MediaOutlet>
        <track src="https://media-files.vidstack.io/subs/english.vtt" label="English" srcLang="en" kind="subtitles" default key="https://media-files.vidstack.io/subs/english.vtt" data-type="vtt" />
        <track src="https://media-files.vidstack.io/subs/german.vtt" label="German" srcLang="de" kind="subtitles" key="https://media-files.vidstack.io/subs/german.vtt" data-type="vtt" />
      </MediaOutlet>
      <Flex
        id="controls"
        sx={{
          flexDirection: 'column',
          position: 'absolute',
          inset: 0,
          w: 'full',
          h: 'full',
          zIndex: 10,
          // pointerEvents: 'none',
          transition: 'opacity 0.2s ease-out',
        }}
      >
        <Flex
          id="controls-group"
          sx={{
            alignItems: 'center',
            marginBottom: '4px',
            pointerEvents: 'auto',
            zIndex: 50,
            padding: '2px 6px',
            marginTop: '4px',
          }}
        >
          <Spacer />
          <MediaMenu>
            <MediaMenuButton aria-label="Settings">
              <SettingsIcon data-rotate w="25px" h="25px" />
            </MediaMenuButton>
            <MediaMenuItems>
              <MediaRadioGroup>
                <label>
                  <input type="radio" name="quality" value="auto" defaultChecked />
                  Auto
                </label>
              </MediaRadioGroup>
            </MediaMenuItems>
          </MediaMenu>
        </Flex>

        <Flex
          sx={{
            flex: '1 1 0%',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
            marginBottom: '4px',
            padding: '2px 6px',
          }}
        />

        <Flex
          sx={{
            alignItems: 'center',
            marginBottom: '-16px',
            padding: '0 12px',
            zIndex: 10,
          }}
        >
          <MediaTimeSlider />
        </Flex>

        <Flex
          sx={{
            w: 'full',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            padding: '2px 6px',
            marginBottom: '4px',
            pointerEvents: 'auto',
          }}
        >
          <MediaPlayButton />
          <MediaMuteButton />
          <MediaVolumeSlider
            style={{
              maxWidth: '80px',
            }}
          >
            <MediaSliderValue type="pointer" format="percent" slot="preview" />
          </MediaVolumeSlider>
          <Flex alignItems="center" h="full" gap={1}>
            <MediaTime type="current" />
            /
            <MediaTime type="duration" />
          </Flex>
          <Flex alignItems="center" ml={2} gap={2} flexGrow={1}>
            <Text h="full" display="flex" alignItems="center" fontSize="3xl">
              •
            </Text>
            <Text display="flex" flexGrow={1}>
              {mainTitle}
            </Text>
          </Flex>
          <MediaCaptionButton />
          <MediaFullscreenButton />
        </Flex>
      </Flex>
    </MediaPlayer>
  );
};

export default NewVidStackPlayer;
