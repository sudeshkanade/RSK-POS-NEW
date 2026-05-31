import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Restaurant } from './restaurant.model';
import { PrismaService } from '../prisma.service';
import { OnboardingService } from './onboarding.service';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(
    private prisma: PrismaService,
    private onboardingService: OnboardingService
  ) {}

  @Query(() => [Restaurant])
  async restaurants() {
    return this.prisma.restaurant.findMany();
  }

  @Query(() => Restaurant, { nullable: true })
  async restaurant(@Args('id') id: string) {
    return this.prisma.restaurant.findUnique({ where: { id } });
  }

  @Mutation(() => Restaurant)
  async createRestaurant(@Args('name') name: string) {
    return this.prisma.restaurant.create({
      data: { name },
    });
  }

  @Mutation(() => Restaurant)
  async onboardRestaurant(
    @Args('name') name: string,
    @Args('slug') slug: string
  ) {
    const { restaurant } = await this.onboardingService.onboardTenant(name, slug);
    return restaurant;
  }
}
