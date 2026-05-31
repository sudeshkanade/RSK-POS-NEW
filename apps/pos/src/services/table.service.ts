import { prisma } from '../db';

export class TableService {
  /**
   * Transfers an active order from one table to another.
   * Source table becomes 'DIRTY' (Needs Cleaning).
   * Target table becomes 'OCCUPIED'.
   */
  async transferTable(sourceTableId: string, targetTableId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Find the active order on the source table
      const activeOrder = await tx.order.findFirst({
        where: { 
          tableId: sourceTableId,
          status: 'PENDING'
        }
      });

      if (!activeOrder) {
        throw new Error('No active order found on source table.');
      }

      // 2. Check if target table is vacant
      const targetTable = await tx.table.findUnique({
        where: { id: targetTableId }
      });

      if (!targetTable || targetTable.status !== 'VACANT') {
        throw new Error('Target table is not vacant.');
      }

      // 3. Update Order tableId
      await tx.order.update({
        where: { id: activeOrder.id },
        data: { 
          tableId: targetTableId,
          syncStatus: 'PENDING',
          version: { increment: 1 }
        }
      });

      // 4. Update Source Table status -> DIRTY
      await tx.table.update({
        where: { id: sourceTableId },
        data: { 
          status: 'DIRTY',
          syncStatus: 'PENDING',
          version: { increment: 1 }
        }
      });

      // 5. Update Target Table status -> OCCUPIED
      await tx.table.update({
        where: { id: targetTableId },
        data: { 
          status: 'OCCUPIED',
          syncStatus: 'PENDING',
          version: { increment: 1 }
        }
      });

      return { success: true, orderId: activeOrder.id };
    });
  }

  /**
   * Cleans a table (sets status from DIRTY back to VACANT)
   */
  async cleanTable(tableId: string) {
    return await prisma.table.update({
      where: { id: tableId },
      data: { 
        status: 'VACANT',
        syncStatus: 'PENDING',
        version: { increment: 1 }
      }
    });
  }
}

export const tableService = new TableService();
