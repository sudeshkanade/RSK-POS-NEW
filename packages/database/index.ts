export * from "./generated/client/index.js";

import { PrismaClient } from './generated/client/index.js';

export const getExtendedPrismaClient = (tenantId?: string) => {
  const prisma = new PrismaClient();

  if (!tenantId) return prisma;

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Bypass global tables like the Restaurant list itself or sync parameters
          const bypassModels = ['Restaurant', 'SyncMetadata'];
          if (bypassModels.includes(model)) {
            return query(args);
          }

          const extendedArgs = args as any;

          // 1. Force tenant binding on inserts
          if (operation === 'create' || operation === 'createMany') {
            extendedArgs.data = {
              ...extendedArgs.data,
              restaurantId: tenantId,
            };
          }

          // 2. Auto-inject tenant filter on reads, updates, and deletes
          if (['findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count'].includes(operation)) {
            extendedArgs.where = {
              ...extendedArgs.where,
              restaurantId: tenantId,
            };
          }

          return query(args);
        },
      },
    },
  });
};
