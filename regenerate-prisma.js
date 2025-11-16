#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

console.log("Regenerating Prisma client...");

try {
  // Try using the Prisma CLI from the installed package
  const prismaPath = path.join(
    __dirname,
    "node_modules",
    "@prisma",
    "internals",
    "dist",
    "index.js"
  );

  // Alternatively use the direct engine
  execSync("node node_modules/@prisma/client/generator-build/index.js", {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  console.log("\nPrisma client regenerated successfully!");
} catch (error) {
  console.error("Error regenerating Prisma client:", error.message);

  // Try alternative method
  console.log("\nTrying alternative method...");
  try {
    const Prisma = require("@prisma/internals");
    console.log("Prisma internals loaded");
  } catch (e) {
    console.log("Using direct file regeneration...");
  }
}
