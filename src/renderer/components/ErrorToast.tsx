import { useToast } from '@chakra-ui/react';
import { FC } from 'react';

const ErrorToast: FC<{ description?: string }> = ({ description }) => {
  const toast = useToast();

  toast({
    id: 'error-toast',
    title: 'An error occurred, please try again later',
    description,
    status: 'error',
    position: 'top-right',
    isClosable: true,
  });

  return null;
};

export default ErrorToast;
