import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getCarFilters() {
  try {
    const makes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { make: true },
      distinct: ["make"],
      orderBy: { make: "asc" },
    });

    //   Get unique body types
    const bodyTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { bodyType: true },
      distinct: ["bodyType"],
      orderBy: { bodyType: "asc" },
    });

    //   Get unique fule types
    const fuelTypes = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { fuelType: true },
      distinct: ["fuelType"],
      orderBy: { fuelType: "asc" },
    });

    //   Get unique transmissions
    const transmissions = await db.car.findMany({
      where: { status: "AVAILABLE" },
      select: { transmission: true },
      distinct: ["transmission"],
      orderBy: { transmission: "asc" },
    });

    //   Get min and max prices using Prisma aggregations
    const priceAggregations = await db.car.aggregate({
      where: { status: "AVAILABLE" },
      _min: { price: true },
      _max: { price: true },
    });

    return {
      success: true,
      data: {
        makes: makes.map((item) => item.make),
        bodyTypes: bodyTypes.map((item) => item.bodyType),
        fuelTypes: fuelTypes.map((item) => item.fuleType),
        transmissions: transmissions.map((item) => item.transmission),
        priceRange: {
          min: priceAggregations._min.price
            ? parseFloat(priceAggregations._min.price.toString())
            : 0,
          max: priceAggregations._max.price
            ? parseFloat(priceAggregations._max.price.toString())
            : 100000,
        },
      },
    };
  } catch (error) {
    throw new Error("error fetching car filters:" + error.message);
  }
}

export async function getCars(
  search = "",
  make = "",
  bodyType = "",
  fuelType = "",
  transmission = "",
  minPrice = "",
  maxPrice = Number.MAX_SAFE_INTEGER,
  sortBy = "newest", // Options: newest, priceAsc, priceDesc
  page = 1,
  limit = 6
) {
  try {
    const { userId } = await auth();
    let dbUser = null;

    if (userId) {
      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    }

    let where = {
      status: "AVAILABLE",
    };

    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (make) where.make = { equals: make, mode: "insensitive" };
    if (bodyType) where.make = { equals: bodyType, mode: "insensitive" };
    if (fuelType) where.fuelType = { equals: fuelType, mode: "insensitive" };
    if (transmission)
      where.fuleType = { equals: transmission, mode: "insensitive" };

    where.price = {
      gte: parseFloat(minPrice) || 0,
    };

    if (maxPrice && maxPrice < Number.MAX_SAFE_INTEGER) {
      where.price.lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;

    // Determine sort order
    let orderBy = {};
    switch (sortBy) {
      case "priceAsc":
        orderBy = { price: "asc" };
        break;
      case "priceDesc":
        orderBy = { price: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const totalCars = await db.car.count({ where });

    // Execute the main query
    const cars = await db.car.findMany({
      where,
      take: limit,
      skip,
      orderBy,
    });

    let wishlisted = new Set();
    if (dbUser) {
      const savedCars = await db.savedCars.findMany({
        where: { userId: dbUser.id },
        select: { carId: true },
      });

      wishlisted = new Set(savedCars.map((saved) => saved.carId));
    }
  } catch (error) {}
}
