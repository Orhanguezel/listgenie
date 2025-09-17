// src/database/prisma.js
const { PrismaClient } = require('@prisma/client');

const globalKey = '__listsgenie_prisma__';
if (!global[globalKey]) {
  global[globalKey] = new PrismaClient();
}
const prisma = global[globalKey];

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { prisma, checkDatabaseConnection };
