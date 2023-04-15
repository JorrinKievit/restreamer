import { BellIcon, SettingsIcon } from '@chakra-ui/icons';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Text,
  List,
  ListItem,
  UnorderedList,
} from '@chakra-ui/react';
import { UpdateInfo } from 'electron-updater';
import { FC, useState } from 'react';

const UpdateModal: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [releaseNotes, setReleaseNotes] =
    useState<UpdateInfo['releaseNotes']>(null);

  const handleUpdate = () => {
    window.electron.ipcRenderer.confirmUpdate();
  };

  const parseHTML = (htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const ulElement = doc.querySelector('h3 + ul');
    const liElements = ulElement ? Array.from(ulElement.children) : [];

    return liElements.map((liElement, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <ListItem key={index}>{liElement.textContent}</ListItem>
    ));
  };

  window.electron.ipcRenderer.on('app-update-available', (info) => {
    setReleaseNotes((info as UpdateInfo).releaseNotes);
    onOpen();
  });

  return (
    <Modal
      closeOnOverlayClick={false}
      isCentered
      scrollBehavior="inside"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update available</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={2}>
            There is a new update available. Do you want to restart and update?
          </Text>
          {releaseNotes && typeof releaseNotes !== 'string' && (
            <List spacing={2}>
              {releaseNotes.map((release) => (
                <ListItem key={release.version}>
                  <Text size="lg" as="b">
                    v{release.version}
                  </Text>
                  <UnorderedList spacing={2}>
                    {parseHTML(release.note as string)}
                  </UnorderedList>
                </ListItem>
              ))}
            </List>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" mr={3} onClick={handleUpdate}>
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UpdateModal;
