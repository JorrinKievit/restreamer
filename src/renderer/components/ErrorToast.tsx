import { useToast } from '@chakra-ui/react';
import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorToastProps {
  description?: string;
  shouldNavigateBack?: boolean;
}

const ErrorToast: FC<ErrorToastProps> = ({
  description,
  shouldNavigateBack = false,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  toast({
    title: 'An error occurred, please try again later',
    description,
    status: 'error',
    position: 'top-right',
    duration: 5000,
    isClosable: true,
  });

  useEffect(() => {
    if (shouldNavigateBack) navigate(-1);
  }, [navigate, shouldNavigateBack, toast]);

  return null;
};

export default ErrorToast;
