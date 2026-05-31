import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates the Menu Engineering Matrix (Stars and Dogs)
   * Stars: High Profit, High Popularity
   * Dogs: Low Profit, Low Popularity
   */
  async getMenuEngineeringMatrix() {
    const items = await this.prisma.menuItem.findMany({
      include: {
        recipes: true,
      },
    });

    // Mocking calculation for now
    return items.map(item => ({
      name: item.name,
      profitability: Math.random() > 0.5 ? 'HIGH' : 'LOW',
      popularity: Math.random() > 0.5 ? 'HIGH' : 'LOW',
      category: this.getCategory(item),
    }));
  }

  private getCategory(item: any) {
    // Stars, Plowing Horses, Puzzles, Dogs
    return 'STAR';
  }

  /**
   * Theoretical vs Actual Food Costing
   */
  async getFoodCostReport() {
    const recipes = await this.prisma.recipe.findMany({
      include: {
        inventoryItem: true,
        menuItem: true,
      },
    });

    return recipes.map(recipe => ({
      menuItem: recipe.menuItem.name,
      theoreticalCost: recipe.theoreticalCost,
      actualCost: recipe.inventoryItem.stockLevel * 10, // Mock calculation
      variance: 0.05,
    }));
  }
}
