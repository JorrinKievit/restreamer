import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import React, { FC } from "react";
import { Button } from "./ui/button";

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
      behavior: "smooth",
    });
  };

  const renderPageButtons = () => {
    const pageButtons = [];

    const createPageButton = (page: number, isActive: boolean) => (
      <Button
        key={page}
        onClick={() => handlePageChange(page)}
        variant={isActive ? "default" : "outline"}
        className="mx-1"
      >
        {page}
      </Button>
    );

    const createEllipsis = (key: string) => (
      <p key={key} className="mx-1">
        ...
      </p>
    );

    const firstVisiblePage = Math.max(1, currentPage - 2);
    const lastVisiblePage = Math.min(totalPages, currentPage + 2);

    if (firstVisiblePage > 1) {
      pageButtons.push(createPageButton(1, false));
      if (firstVisiblePage > 2) {
        pageButtons.push(createEllipsis("ellipsis1"));
      }
    }

    for (let i = firstVisiblePage; i <= lastVisiblePage; i += 1) {
      pageButtons.push(createPageButton(i, i === currentPage));
    }

    if (lastVisiblePage < totalPages) {
      if (lastVisiblePage < totalPages - 1) {
        pageButtons.push(createEllipsis("ellipsis2"));
      }
      pageButtons.push(createPageButton(totalPages, false));
    }

    return pageButtons;
  };

  return (
    <div className="mt-4 flex items-center justify-center">
      <Button
        aria-label="To First Page"
        variant="outline"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className="mr-2"
      >
        <ArrowLeft />
      </Button>
      <Button
        aria-label="Previous Page"
        variant="outline"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="mr-2"
      >
        <ChevronLeft />
      </Button>
      {renderPageButtons()}
      <Button
        aria-label="Next Page"
        variant="outline"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ml-2"
      >
        <ChevronRight />
      </Button>
      <Button
        aria-label="To First Page"
        variant="outline"
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="ml-2"
      >
        <ArrowRight />
      </Button>
    </div>
  );
};

export { Pagination };
