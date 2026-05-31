import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  gstNo?: string;

  @Field(() => Int)
  version: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
