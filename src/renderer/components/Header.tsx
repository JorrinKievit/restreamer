import { SearchIcon, SettingsIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  chakra,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { client } from 'renderer/api/trpc';
import useConnectionStatus from 'renderer/hooks/useConnectionStatus';

const Header: FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const isOnline = useConnectionStatus();

  const { data } = client.app.getAppVersion.useQuery(undefined, {
    networkMode: 'always',
  });

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isOnline) return;
    e.preventDefault();
    navigate(`/search/${searchInput}`);
  };

  return (
    <>
      <chakra.header py={4} borderBottom="1px" borderBottomColor="gray.600">
        <Flex alignItems="center" justifyContent="space-between" mx="auto">
          <Flex>
            <Button variant="ghost">
              <NavLink to="/">Restreamer v{data}</NavLink>
            </Button>
          </Flex>
          <HStack display="flex" alignItems="center" spacing={4}>
            <Button
              variant="ghost"
              as={NavLink}
              to={isOnline ? '/movies' : '#'}
              _activeLink={
                isOnline ? { bgColor: 'blue.200', color: 'gray.800' } : {}
              }
              isDisabled={!isOnline}
            >
              Movies
            </Button>
            <Button
              variant="ghost"
              as={NavLink}
              to={isOnline ? '/tvshows' : '#'}
              _activeLink={
                isOnline ? { bgColor: 'blue.200', color: 'gray.800' } : {}
              }
              isDisabled={!isOnline}
            >
              TV Shows
            </Button>

            <form onSubmit={handleSubmit}>
              <InputGroup>
                <Input
                  type="text"
                  placeholder="Search..."
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={!isOnline}
                />
                <InputRightAddon
                  // eslint-disable-next-line react/no-children-prop
                  children={
                    <IconButton
                      icon={<SearchIcon />}
                      bg="none"
                      type="submit"
                      aria-label="search shows"
                      isDisabled={!isOnline}
                    />
                  }
                />
              </InputGroup>
            </form>

            <IconButton
              as={NavLink}
              to={isOnline ? '/settings' : '#'}
              icon={<SettingsIcon />}
              isDisabled={!isOnline}
              aria-label="Navigate to settings"
            />
          </HStack>
        </Flex>
      </chakra.header>
      {!isOnline && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>
            The App is running in Offline Mode and has limited functionality.
          </AlertTitle>
        </Alert>
      )}
    </>
  );
};

export default Header;
