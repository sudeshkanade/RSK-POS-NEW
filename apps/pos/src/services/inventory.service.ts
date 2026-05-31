import { prisma } from '../db';

export class InventoryService {
  /**
   * Automatically deducts inventory stock based on the items in a settled order.
   */
  async deductInventoryFromOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch the order with its items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) throw new Error('Order not found');

      // 2. For each item in the order, find its recipe
      for (const item of order.items) {
        // Find the MenuItem and its Recipes
        const menuItem = await tx.menuItem.findFirst({
          where: { name: item.menuItem },
          include: { recipes: true }
        });

        if (!menuItem || !menuItem.recipes) continue;

        // 3. Deduct stock for each ingredient in the recipe
        for (const recipe of menuItem.recipes) {
          const deductionAmount = recipe.quantity * item.qty;

          await tx.inventoryItem.update({
            where: { id: recipe.inventoryItemId },
            data: {
              stockLevel: { decrement: deductionAmount },
              syncStatus: 'PENDING',
              version: { increment: 1 }
            }
          });
        }
      }

      return { success: true };
    });
  }

  /**
   * Checks for price fluctuations and returns alerts if any ingredient 
   * has changed by more than 5%.
   */
  async checkPriceFluctuations() {
    // This would typically compare current purchase prices vs a baseline.
    // Mocking for now.
    return [
      { ingredient: 'Chicken Breast', change: '+7%', status: 'ALERT' },
      { ingredient: 'Cooking Oil', change: '+12%', status: 'ALERT' }
    ];
  }
}

export const inventoryService = new InventoryService();
