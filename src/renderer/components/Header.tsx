import { SearchIcon, SettingsIcon } from '@chakra-ui/icons';
import {
  Button,
  chakra,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Header: FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [version, setVersion] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(`/search/${searchInput}`);
  };

  useEffect(() => {
    const getVersion = async () => {
      const v = await window.electron.ipcRenderer.getVersion();
      setVersion(v);
    };
    getVersion();
  }, []);

  return (
    <chakra.header py={4} borderBottom="1px" borderBottomColor="gray.600">
      <Flex alignItems="center" justifyContent="space-between" mx="auto">
        <Flex>
          <Button variant="ghost">
            <NavLink to="/">Restreamer v{version}</NavLink>
          </Button>
        </Flex>
        <HStack display="flex" alignItems="center" spacing={4}>
          <Button
            variant="ghost"
            as={NavLink}
            to="/movies"
            _activeLink={{
              bgColor: 'blue.200',
              color: 'gray.800',
            }}
          >
            Movies
          </Button>
          <Button
            variant="ghost"
            as={NavLink}
            to="/tvshows"
            _activeLink={{
              bgColor: 'blue.200',
              color: 'gray.800',
            }}
          >
            TV Shows
          </Button>

          <form onSubmit={handleSubmit}>
            <InputGroup>
              <Input
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <InputRightAddon
                // eslint-disable-next-line react/no-children-prop
                children={
                  <IconButton
                    icon={<SearchIcon />}
                    bg="none"
                    type="submit"
                    aria-label="search shows"
                  />
                }
              />
            </InputGroup>
          </form>

          <IconButton
            icon={
              <NavLink
                to="/settings"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SettingsIcon />
              </NavLink>
            }
            aria-label="Navigate to settings"
          />
        </HStack>
      </Flex>
    </chakra.header>
  );
};

export default Header;
