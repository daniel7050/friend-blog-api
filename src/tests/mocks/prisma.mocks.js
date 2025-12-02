// Shared factory to create Prisma client mock objects for Vitest.
// Use `globalThis.vi` so mocks are created at test runtime and avoid TDZ/hoisting issues.
function fn() {
  return globalThis.vi.fn();
}

function createPrismaMock() {
  return {
    like: { findFirst: fn(), create: fn(), delete: fn() },
    post: {
      findMany: fn(),
      findUnique: fn(),
      create: fn(),
      update: fn(),
      delete: fn(),
    },
    comment: {
      findUnique: fn(),
      update: fn(),
      delete: fn(),
      create: fn(),
      findMany: fn(),
    },
    notification: {
      findMany: fn(),
      findUnique: fn(),
      create: fn(),
      update: fn(),
    },
    userFollow: {
      findUnique: fn(),
      create: fn(),
      deleteMany: fn(),
      findMany: fn(),
    },
    user: { findUnique: fn(), update: fn(), findMany: fn(), create: fn() },
    // add other models as needed
  };
}

module.exports = { createPrismaMock };
