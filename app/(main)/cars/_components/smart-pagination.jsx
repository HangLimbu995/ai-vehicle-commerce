// components/SmartPagination.js
"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function SmartPagination({ currentPage, totalPages, onPageChange }) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const renderPageButtons = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => (
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i + 1}
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      ));
    }

    const items = [];

    if (currentPage !== 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage - 2 > 1) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (currentPage - 1 > 1) {
      items.push(
        <PaginationItem key="prev">
          <PaginationLink onClick={() => onPageChange(currentPage - 1)}>
            {currentPage - 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    items.push(
      <PaginationItem key="current">
        <PaginationLink isActive>{currentPage}</PaginationLink>
      </PaginationItem>
    );

    if (currentPage + 1 < totalPages) {
      items.push(
        <PaginationItem key="next">
          <PaginationLink onClick={() => onPageChange(currentPage + 1)}>
            {currentPage + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (currentPage + 2 < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (currentPage !== totalPages) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem
          className={`cursor-pointer ${
            currentPage === 1
              ? "opacity-40 select-none cursor-default pointer-events-none"
              : ""
          }`}
        >
          <PaginationPrevious onClick={handlePrev} />
        </PaginationItem>

        {renderPageButtons()}

        <PaginationItem
          className={`cursor-pointer ${
            currentPage === totalPages
              ? "opacity-40 select-none cursor-default pointer-events-none"
              : ""
          }`}
        >
          <PaginationNext onClick={handleNext} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
} 
