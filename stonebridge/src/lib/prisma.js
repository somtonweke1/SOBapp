const { PrismaClient } = require("@prisma/client");

const prisma = global.__stonebridgePrisma || new PrismaClient();

if (!global.__stonebridgePrisma) {
  global.__stonebridgePrisma = prisma;
}

module.exports = { prisma };
