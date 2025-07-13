"use client";

import { getCars } from "@/actions/car-listing";
import useFetch from "@/hooks/use-fetch";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import CarListingsLoading from "./car-listings-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CarCard from "@/components/car-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SmartPagination } from "./smart-pagination";

const CarListings = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const limit = 6;

  // Extract filter values from searchParams
  const search = searchParams.get("search") || "";
  const make = searchParams.get("make") || "";
  const bodyType = searchParams.get("bodyType") || "";
  const fuelType = searchParams.get("fuelType") || "";
  const transimssion = searchParams.get("transmission") || "";
  const minPrice = searchParams.get("minPrice") || 0;
  const maxPrice = searchParams.get("maxPrice") || Number.MAX_SAFE_INTEGER;
  const sortBy = searchParams.get("sortBy") || "newest";
  const page = parseInt(searchParams.get("page") || "1");

  const [currentPage, setCurrentPage] = useState(page);

  const { loading, fn: fetchCars, data: result, error } = useFetch(getCars);

  useEffect(() => {
    fetchCars({
      search,
      make,
      bodyType,
      fuelType,
      transimssion,
      minPrice,
      maxPrice,
      sortBy,
      page,
      limit,
    });
  }, [
    search,
    make,
    bodyType,
    fuelType,
    transimssion,
    minPrice,
    maxPrice,
    sortBy,
    page,
  ]);

  useEffect(() => {
    if (currentPage !== page) {
      const params = new URLSearchParams(searchParams);
      params.set("page", currentPage.toString());
      router.push(`?page=${currentPage}`);
    }
  }, [currentPage, page, searchParams, router]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (loading && !result) {
    return <CarListingsLoading />;
  }

  if (error || !result || !result?.success) {
    <Alert variant="destructive">
      <Info className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load cars. Please try again later.
      </AlertDescription>
    </Alert>;
  }

  if (!result || !result.data) {
    return null;
  }

  const { data: cars, pagination } = result;
  // console.log("pagination is ", pagination);

  // const prevPageHandler = () => {
  //   setCurrentPage((prev) => Math.max(prev - 1, 1));
  // };
  // const nextPageHandler = () => {
  //   setCurrentPage((prev) => Math.min(prev + 1, pagination.pages));
  //   console.log("next page", currentPage);
  // };

  if (cars.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-cetner justify-center text-center p-8 border rounded-lg bg-gray-50">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Info className="h-8 w-8 text-gray-500" />
        </div>

        <h3 className="text-lg font-medium mb-2">No cars found</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          We couldn't find any matching your search criteria. Try adjusting your
          filters or search term.
        </p>
        <Button variant="outline" asChild>
          <Link href="/cars">Clear all filters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-medium">
            {(page - 1) * limit + 1} -{" "}
            {Math.min(page * limit, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total}</span> cars
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
      <div className=" mt-8 ">
        {/* <SmartPagination
          currentPage={currentPage}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        /> */}
      </div>
      <div className=" mt-8 ">
        {pagination.pages <= 5 ? (
          <Pagination>
            <PaginationContent>
              {Array.from({ length: pagination.pages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        ) : (
          <Pagination>
            <PaginationContent>
              <PaginationItem
                className={`cursor-pointer ${
                  currentPage === 1
                    ? "opacity-40 select-none cursor-default pointer-events-none"
                    : ""
                }`}
              >
                {/* previous button */}
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage <= 1}
                />
                {/* show 1st page pagination when not in 1st page */}
              </PaginationItem>
              {currentPage !== 1 && (
                <PaginationItem className="cursor-pointer">
                  <PaginationLink onClick={() => setCurrentPage(1)}>
                    {1}
                  </PaginationLink>
                </PaginationItem>
              )}
              {/* show ellipsis if before current page has 2 ore more gaps */}
              {currentPage - 2 > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* show before pagination num of the current page */}
              {currentPage - 1 > 1 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* show current page */}
              <PaginationItem className="cursor-pointer">
                <PaginationLink isActive={true} aria-current="page">
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {/* show after pagination num of the current page */}
              {currentPage + 1 < pagination.pages && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* show ellipsis if 2 or more page num after current page */}
              {currentPage + 2 < pagination.pages && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* show last pagination num if not in last page num */}
              {currentPage !== pagination.pages && (
                <PaginationItem className="cursor-pointer">
                  <PaginationLink
                    onClick={() => setCurrentPage(pagination.pages)}
                  >
                    {pagination.pages}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* next page button */}
              <PaginationItem
                className={`cursor-pointer ${
                  currentPage >= pagination.pages
                    ? "opacity-40 select-none cursor-default pointer-events-none"
                    : ""
                }`}
              >
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.pages)
                    )
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default CarListings;
