import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  VStack,
  FormControl,
  FormLabel,
  Input,
  CardFooter,
  Button,
  TableContainer,
  Table,
  Tbody,
  Tr,
  Td,
  Text,
} from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { OpenSubtitlesUser } from 'main/api/opensubtitles/user-information.types';
import { useLocalStorage } from 'usehooks-ts';
import { client } from 'renderer/api/trpc';

const initialOpenSubtitlesData: OpenSubtitlesUser = {
  token: '',
  user: {
    allowed_downloads: 0,
    level: '',
    user_id: 0,
    ext_installed: false,
    vip: false,
    remaining_downloads: 0,
  },
};

const OpenSubtitlesSettings: FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [opensubtitlesData, setOpensubtitlesData] =
    useLocalStorage<OpenSubtitlesUser>(
      'opensubtitles',
      initialOpenSubtitlesData
    );

  const {
    mutate: login,
    error: errorLogin,
    isLoading: isLoadingLogin,
  } = client.opensubtitles.login.useMutation();

  const {
    mutate: logout,
    isLoading: isLoadingLogout,
    error: errorLogout,
  } = client.opensubtitles.logout.useMutation();

  const handleLogout = async () => {
    logout(
      {
        token: opensubtitlesData.token,
      },
      {
        onSuccess: () => {
          setOpensubtitlesData(initialOpenSubtitlesData);
        },
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login(
      {
        username,
        password,
      },
      {
        onSuccess: (res) => {
          setOpensubtitlesData(res);
        },
      }
    );
  };

  return (
    <Card h="full">
      <CardHeader>
        <Heading>OpenSubtitles.com Login</Heading>
      </CardHeader>
      {!opensubtitlesData?.token ? (
        <form onSubmit={handleSubmit}>
          <CardBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              {errorLogin && <Text color="tomato">{errorLogin.message}</Text>}
            </VStack>
          </CardBody>
          <CardFooter justifyContent="flex-end" pt={0}>
            <Button type="submit" isLoading={isLoadingLogin} colorScheme="blue">
              Login
            </Button>
          </CardFooter>
        </form>
      ) : (
        <>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Tbody>
                  <Tr>
                    <Td>User ID</Td>
                    <Td>{opensubtitlesData.user.user_id}</Td>
                  </Tr>
                  <Tr>
                    <Td>Allowed downloads</Td>
                    <Td>{opensubtitlesData.user.allowed_downloads}</Td>
                  </Tr>
                  <Tr>
                    <Td>Remaining downloads</Td>
                    <Td>{opensubtitlesData.user.remaining_downloads}</Td>
                  </Tr>
                  <Tr>
                    <Td>Level</Td>
                    <Td>{opensubtitlesData.user.level}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
          <CardFooter justifyContent="flex-end">
            <Button
              colorScheme="blue"
              isLoading={isLoadingLogout}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </CardFooter>
          {errorLogout && <Text color="tomato">{errorLogout.message}</Text>}
        </>
      )}
    </Card>
  );
};

export default OpenSubtitlesSettings;
