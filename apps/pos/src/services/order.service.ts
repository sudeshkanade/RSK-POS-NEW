import { prisma } from '../db';

export class OrderService {
  /**
   * Recalls a settled or bill-printed order back to PENDING status.
   * Useful for corrections after payment was initiated but failed or needs changes.
   */
  async recallOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { table: true }
      });

      if (!order) throw new Error('Order not found');

      // 1. Revert order status
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'PENDING',
          syncStatus: 'PENDING',
          version: { increment: 1 }
        }
      });

      // 2. Ensure table status is updated to OCCUPIED if it was settled
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { 
            status: 'OCCUPIED',
            syncStatus: 'PENDING',
            version: { increment: 1 }
          }
        });
      }

      return { success: true };
    });
  }

  /**
   * Generates a QR Code URL for a table.
   * In a real app, this would point to the customer-facing "Live Tab" app.
   */
  getTableQRLink(tableId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || 'https://restro.os/live';
    return `${baseUrl}/table/${tableId}`;
  }
}

export const orderService = new OrderService();
