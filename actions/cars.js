"use server";

import { bodyTypes } from "@/lib/data";
import { serializeCarData } from "@/lib/helper";
import { db } from "@/lib/prisma";
import { createClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Function to convert File to base64
async function fileToBase64(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
}

// Gemini AI integration for car image processing
export async function processCarImageWithAI(file) {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image file to base64
    const base64Image = await fileToBase64(file);

    // Create image part for the model
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    // Define the prompt for car detail extraction
    const prompt = `
      Analyze this car image and extract the following information and don't miss anything if possible:
      1. Make (manufacturer)
      2. Model
      3. Year (approximately)
      4. Color
      5. Body type (SUV, Sedan, Hatchback,convertible, coupe, wagon, pickup etc.)
      6. Mileage (give your best guess)
      7. Fuel type (your best guess) (options are (petrol, deisel, Electric, Hybrid, Plug-in Hybrid))
      8. Transmission type (your best guess)
      9. Price (your best guess just number without any sign but in string)
      9. Short Description as to be added to a car listing
      10. Number of Seats

      Format your response as a clean JSON object with these fields:
      {
        "make": "",
        "model": "",
        "year": "0000",
        "color": "",
        "price": "",
        "mileage": "",
        "bodyType": "",
        "fuelType": "",
        "transmission": "",
        "description": "",
        "seats": "",
        "confidence": 0.0,
      }

      For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
      Only respond with the JSON object, nothing else.
    `;

    // Get response from Gemini
    const result = await model.generateContent([imagePart, prompt]);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse the JSON response
    try {
      const carDetails = JSON.parse(cleanedText);

      // Validate the response format
      const requiredFields = [
        "make",
        "model",
        "year",
        "color",
        "bodyType",
        "price",
        "mileage",
        "fuelType",
        "transmission",
        "description",
        "confidence",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(field in carDetails)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `AI response missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Return success response with data
      return {
        success: true,
        data: carDetails,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", text);
      return {
        success: false,
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    console.error();
    throw new Error("Gemini API error:" + error.message);
  }
}

// export async function addCar({ carData, images }) {
//   try {
//     const { userId } = await auth();
//     if (!userId) throw new Error("Unauthorized");

//     const user = await db.user.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     if (!user) throw new Error("User not found");

//     const carId = uuidv4();
//     const folderPath = `cars/${carId}`;

//     const cookieStore = await cookies();
//     const supabase = createClient(cookieStore);

//     const imageUrls = [];

//     for (let i = 0; i < images.length; i++) {
//       const base64Data = images[i];

//       // Skip if image data is not valid
//       if (!base64Data || !base64Data.startsWith("data:image/")) {
//         console.warm("Skipping invalid image data");
//         continue;
//       }

//       //   Extract the base64 part (remove the data:image/xyz;base64, prefix)
//       const base64 = base64Data.split(",")[1];
//       const imageBuffer = Buffer.from(base64, "base64");

//       // Determine file extension from the data URL
//       const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
//       const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

//       //   Create filename
//       const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
//       const filePath = `${folderPath}/${fileName}`;

//       const { data, error } = await supabase.storage
//         .from("car-images")
//         .upload(filePath, imageBuffer, {
//           contentType: `image/${fileExtension}`,
//         });

//       if (error) {
//         console.error("Error uploading image:", error);
//         throw new Error(`Failed to upload image: ${error.message}`);
//       }

//       const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`;

//       imageUrls.push(publicUrl);
//     }

//     if (imageUrls.length === 0) {
//       throw new Error("No valid images were uploaded");
//     }

//     const car = await db.car.create({
//       data: {
//         id: carId,
//         make: carData.make,
//         model: carData.model,
//         year: carData.year,
//         price: carData.price,
//         mileage: carData.mileage,
//         color: carData.color,
//         fuelType: carData.fuelType,
//         transmission: carData.transmission,
//         bodyType: carData.bodyType,
//         seats: carData.seats,
//         description: carData.description,
//         status: carData.status,
//         featured: carData.featured,
//         images: imageUrls, // Store the array of images URLs
//       },
//     });

//     revalidatePath("/admin/cars");

//     return {
//       success: true,
//     };
//   } catch (error) {
//     throw new Error("Error adding car:" + error.message);
//   }
// }

export async function addCar({ carData, images }) {
  try {
    const { userId } = await auth();

    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found!");

    // Create a unique folder name for this car's image
    const carId = uuidv4();
    const folderPath = `cars/${carId}`;

    // Initialize Supabase client for server-side operations
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Upload all images to Supabase storege
    const imageUrls = [];

    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i];

      // Skip if image data is not valid
      if (!base64Data || !base64Data.startsWith("data:image/")) {
        console.warn("Skipping invalid image data");
        continue;
      }

      // Extract the base64 part (remove the data:image/xyz;base64, prefix)
      const base64 = base64Data.split(",")[1];
      const imageBuffer = Buffer.from(base64, "base64");

      // Determine file extension from the data URL
      const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
      const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload the file buffer directly
      const { error } = await supabase.storage
        .from("car-images")
        .upload(filePath, imageBuffer, {
          contentType: `image/${fileExtension}`,
        });

      if (error) {
        console.error("Error uplaoding image:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-images/${filePath}`; // disable cache in config

      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0) {
      throw new Error("No valid images were uplaoded");
    }

    // Add the car to the database
    const car = await db.car.create({
      data: {
        id: carId, // Use the same ID we used for the folder
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        color: carData.color,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        bodyType: carData.bodyType,
        seats: carData.seats,
        description: carData.description,
        status: carData.status,
        featured: carData.featured,
        images: imageUrls, // Store the array of image URLs
      },
    });

    revalidatePath("/admin/cars");
    return {
      success: true,
    };
  } catch (error) {
    throw new Error("Error adding car:" + error.message);
  }
}

// export async function getCars(search = "") {
//   try {
//     const { userId } = await auth();
//     if (!userId) throw new Error("Unauthorized");

//     const user = await db.user.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     if (!user) throw new Error("User not found");

//     let where = {};

//     if (search) {
//       where.OR = [
//         { make: { contains: search, mode: "insensitive" } },
//         { model: { contains: search, mode: "insensitive" } },
//         { color: { contains: search, mode: "insensitive" } },
//       ];
//     }

//     const cars = await db.car.findMany({
//       where,
//       orderBy: { createdAt: "desc" },
//     });

//     const serializedCars = cars.map(serializeCarData);

//     return {
//       success: true,
//       data: serializedCars,
//     };
//   } catch (error) {
//     console.log("Error fetching cars:", error);
//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// }

export async function getCars(search = "") {
  try {
    // Build where conditions
    let where = {};

    // Add search filter
    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute main query
    const cars = await db.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const serializedCars = cars.map(serializeCarData);

    return {
      success: true,
      data: serializedCars,
    };
  } catch (error) {
    console.error("Error fetching cars:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// export async function deleteCar(id) {
//   try {
//     const { userId } = await auth();

//     if (!userId) throw new Error("Unauthorized");

//     const user = await db.user.findUnique({
//       where: {
//         clerkUserId: userId,
//       },
//     });

//     if (!user) throw new Error("User not found!");

//     // First, fetch the car to get its images
//     const car = await db.car.findUnique({
//       where: { id },
//       select: { images: true },
//     });

//     if (!car) {
//       return {
//         success: false,
//         error: "Car not found",
//       };
//     }

//     // Delete the car from the database
//     await db.car.delete({
//       where: { id },
//     });

//     try {
//       const cookieStore = await cookies();
//       const supabase = createClient(cookieStore);

//       const filePaths = car.images
//         .map((imageUrl) => {
//           const url = new URL(imageUrl);
//           const pathMatch = url.pathname.match(/\/car-images\/(.*)/);
//           return pathMatch ? pathMatch[1] : null;
//         })
//         .filter(Boolean);

//       if (filePaths.length > 0) {
//         const { error } = await supabase.storage
//           .from("car-images")
//           .remove(filePaths);

//         if (error) {
//           console.error("Error deleting images:", error);
//           // We continue even if image deletion fails
//         }
//       }
//     } catch (storageError) {
//       console.error("Error with storage operations:", storageError);
//     }

//     revalidatePath("/admin/cars");

//     return {
//       success: true,
//     };
//   } catch (error) {
//     console.error("Error deleting car:", error);
//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// }

export async function deleteCar(id) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // First, fetch the car to get its images
    const car = await db.car.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!car) {
      return {
        success: false,
        error: "Car not found",
      };
    }

    // Delete the car from the database
    await db.car.delete({
      where: { id },
    });

    // Delete the images from Supabase storage
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      // Get the folder path from the first image URL
      if (car.images.length > 0) {
        const firstImageUrl = car.images[0];
        const url = new URL(firstImageUrl);
        const pathMatch = url.pathname.match(/\/car-images\/(cars\/[^/]+)/);
        
        if (pathMatch) {
          const folderPath = pathMatch[1]; // This will be "cars/uuid"
          console.log("Found folder path:", folderPath);

          // First list all files in the folder
          const { data: files, error: listError } = await supabase.storage
            .from("car-images")
            .list(folderPath);

          if (listError) {
            console.error("Error listing files:", listError);
            throw new Error(`Failed to list files: ${listError.message}`);
          }

          if (files && files.length > 0) {
            console.log("Files found in folder:", files);

            // Create array of full paths to delete
            const pathsToDelete = files.map(file => `${folderPath}/${file.name}`);
            console.log("Paths to delete:", pathsToDelete);

            // Delete all files
            const { error: deleteError } = await supabase.storage
              .from("car-images")
              .remove(pathsToDelete);

            if (deleteError) {
              console.error("Error deleting files:", deleteError);
              console.error("Error details:", {
                message: deleteError.message,
                statusCode: deleteError.statusCode,
                name: deleteError.name
              });
            } else {
              console.log("Successfully deleted all files in folder");
            }
          } else {
            console.log("No files found in folder");
          }
        }
      }
    } catch (storageError) {
      console.error("Error with storage operations:", storageError);
    }

    revalidatePath("/admin/cars");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting car:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateCarStatus(id, { status, featured }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required");
    }

    const updateData = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (featured !== undefined) {
      updateData.featured = featured;
    }

    // Update the car
    await db.car.update({
      where: { id },
      data: updateData,
    });

    // Revalidate the cars list page
    revalidatePath("/admin/cars");

    return { success: true };
  } catch (error) {
    console.error("Error updating car status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
