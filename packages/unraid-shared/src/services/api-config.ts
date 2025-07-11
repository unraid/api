import { Field, ObjectType } from "@nestjs/graphql";
import { IsString, IsArray, IsOptional, IsBoolean } from "class-validator";

@ObjectType()
export class ApiConfig {
  @Field()
  @IsString()
  version!: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  extraOrigins!: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  ssoSubIds!: string[];

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  plugins!: string[];
}
