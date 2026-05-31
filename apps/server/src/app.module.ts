import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { SyncController } from './sync/sync.controller';
import { SyncService } from './sync/sync.service';
import { RestaurantResolver } from './restaurants/restaurant.resolver';
import { OnboardingService } from './restaurants/onboarding.service';
import { EventsGateway } from './events/events.gateway';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { TenantMiddleware } from './auth/tenant.middleware';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
  controllers: [AppController, SyncController, AnalyticsController],
  providers: [AppService, PrismaService, SyncService, RestaurantResolver, OnboardingService, EventsGateway, AnalyticsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
