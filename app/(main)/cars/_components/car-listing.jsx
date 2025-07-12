"use client";

import { getCars } from "@/actions/car-listing";
import useFetch from "@/hooks/use-fetch";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import CarListingsLoading from "./car-listings-loading";

const CarListings = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
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
  }),
    [
      search,
      make,
      bodyType,
      fuelType,
      transimssion,
      minPrice,
      maxPrice,
      sortBy,
      page,
    ];

  if (loading && !result) {
    return <CarListingsLoading />;
  }

  return <div>CarListings</div>;
};

export default CarListings;
