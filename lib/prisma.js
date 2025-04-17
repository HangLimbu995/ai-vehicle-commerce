import { PrismaClient } from "./generated/prisma"


export const db = globalThis.prisma ||  new PrismaClient

if(process.env.NODE_ENV !== "Production") {
    globalThis.prisma = db
}

// globalThis.prisma: This global variable ensures taht the Prisma client instance is resued across hot reloads during development. Without this, each time your application relaods, a new instance of the Prisma client would be created, potentially leading to connection issues.