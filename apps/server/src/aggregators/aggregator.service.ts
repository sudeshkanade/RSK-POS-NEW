import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AggregatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Mocks the ingestion of an external order.
   * In production, this would be triggered by a webhook from Swiggy/Zomato.
   */
  async ingestOrder(origin: 'SWIGGY' | 'ZOMATO', externalData: any) {
    const { orderId, items, total } = externalData;

    return await this.prisma.order.create({
      data: {
        id: `EXT-${origin}-${orderId}`,
        restaurantId: externalData.restaurantId,
        origin: origin,
        subtotal: total * 0.95,
        tax: total * 0.05,
        total: total,
        status: 'PENDING',
        syncStatus: 'SYNCED', // Already in cloud
        version: 1,
        // Map external items to OrderItem
        items: {
          create: items.map((item: any) => ({
            menuItem: item.name,
            qty: item.qty,
            price: item.price,
            version: 1,
            syncStatus: 'SYNCED',
          }))
        }
      }
    });
  }
}
