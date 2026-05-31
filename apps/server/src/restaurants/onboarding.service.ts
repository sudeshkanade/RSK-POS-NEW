import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@repo/database';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async onboardTenant(name: string, slug: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Setup tenant profile
      const restaurant = await tx.restaurant.create({
        data: {
          name,
          slug,
          licenseKey: `RSTR-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          settings: { taxRate: 5.0, currency: 'INR' }
        }
      });

      // 2. Initialize tenant's default admin user
      const user = await tx.user.create({
        data: {
          name: `${name} Owner`,
          username: `${slug}-admin`,
          role: UserRole.ADMIN,
          restaurantId: restaurant.id
        }
      });

      // 3. Create default floor plans
      await tx.table.createMany({
        data: [
          { name: 'Table 1', capacity: 2, restaurantId: restaurant.id },
          { name: 'Table 2', capacity: 4, restaurantId: restaurant.id }
        ]
      });

      return { restaurant, user };
    });
  }
}
