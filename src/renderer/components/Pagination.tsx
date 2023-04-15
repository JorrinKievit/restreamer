import React, { FC } from 'react';
import { Button, Flex, IconButton, Text } from '@chakra-ui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const renderPageButtons = () => {
    const pageButtons = [];

    const createPageButton = (page: number, isActive: boolean) => (
      <Button
        key={page}
        onClick={() => handlePageChange(page)}
        isActive={isActive}
        mx={1}
      >
        {page}
      </Button>
    );

    const createEllipsis = (key: string) => (
      <Text key={key} mx={1}>
        ...
      </Text>
    );

    const firstVisiblePage = Math.max(1, currentPage - 2);
    const lastVisiblePage = Math.min(totalPages, currentPage + 2);

    if (firstVisiblePage > 1) {
      pageButtons.push(createPageButton(1, false));
      if (firstVisiblePage > 2) {
        pageButtons.push(createEllipsis('ellipsis1'));
      }
    }

    for (let i = firstVisiblePage; i <= lastVisiblePage; i += 1) {
      pageButtons.push(createPageButton(i, i === currentPage));
    }

    if (lastVisiblePage < totalPages) {
      if (lastVisiblePage < totalPages - 1) {
        pageButtons.push(createEllipsis('ellipsis2'));
      }
      pageButtons.push(createPageButton(totalPages, false));
    }

    return pageButtons;
  };

  return (
    <Flex align="center" justify="center" mt={4}>
      <IconButton
        aria-label="To First Page"
        icon={<ArrowLeftIcon />}
        onClick={() => handlePageChange(1)}
        isDisabled={currentPage === 1}
        mr={2}
        colorScheme="blue"
      />
      <IconButton
        aria-label="Previous Page"
        icon={<ChevronLeftIcon boxSize={8} />}
        onClick={() => handlePageChange(currentPage - 1)}
        isDisabled={currentPage === 1}
        mr={2}
        colorScheme="blue"
      />
      {renderPageButtons()}
      <IconButton
        aria-label="Next Page"
        icon={<ChevronRightIcon boxSize={8} />}
        onClick={() => handlePageChange(currentPage + 1)}
        isDisabled={currentPage === totalPages}
        ml={2}
        colorScheme="blue"
      />
      <IconButton
        aria-label="To First Page"
        icon={<ArrowRightIcon />}
        onClick={() => handlePageChange(totalPages)}
        isDisabled={currentPage === totalPages}
        ml={2}
        colorScheme="blue"
      />
    </Flex>
  );
};

export default Pagination;
