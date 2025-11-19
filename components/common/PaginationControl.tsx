"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

const PaginationControl = ({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationControlProps) => {
  const totalPages = useMemo(() => {
    if (!pageSize || pageSize <= 0) return 0;
    return Math.ceil(total / pageSize);
  }, [pageSize, total]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pagesSet = new Set<number>();
    pagesSet.add(1);
    pagesSet.add(totalPages);

    const startRange = Math.max(2, page - siblingCount);
    const endRange = Math.min(totalPages - 1, page + siblingCount);

    for (let i = startRange; i <= endRange; i += 1) {
      pagesSet.add(i);
    }

    if (page <= 3) {
      for (let i = 2; i <= 5 && i < totalPages; i += 1) {
        pagesSet.add(i);
      }
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - 4; i < totalPages; i += 1) {
        if (i > 1) pagesSet.add(i);
      }
    }

    return Array.from(pagesSet).sort((a, b) => a - b);
  }, [page, siblingCount, totalPages]);

  const handleChange = (targetPage: number) => {
    if (targetPage === page) return;
    if (targetPage < 1 || targetPage > totalPages) return;
    onPageChange(targetPage);
  };

  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className={cn("mt-8 flex justify-center", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page <= 1}
            onClick={() => handleChange(page - 1)}
          />
        </PaginationItem>

        {visiblePages.map((pageNumber, index) => {
          const prevPage = visiblePages[index - 1];
          const showEllipsis =
            typeof prevPage === "number" && pageNumber - prevPage > 1;

          return (
            <React.Fragment key={pageNumber}>
              {showEllipsis && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  onClick={() => handleChange(pageNumber)}
                  isActive={page === pageNumber}
                  className="cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            </React.Fragment>
          );
        })}

        <PaginationItem>
          <PaginationNext
            disabled={page >= totalPages}
            onClick={() => handleChange(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationControl;

