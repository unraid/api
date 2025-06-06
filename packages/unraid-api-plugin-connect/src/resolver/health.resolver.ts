import { ConfigService } from '@nestjs/config';
import { Mutation, Query, Resolver } from '@nestjs/graphql';

import { demoShared } from '@unraid/shared';

@Resolver()
export class HealthResolver {
    constructor(private readonly configService: ConfigService) {}

    @Query(() => String)
    health() {
        // You can replace the return value with your actual health check logic
        return demoShared;
    }

    @Query(() => String)
    getDemo() {
        return this.configService.get('connect.demo');
    }

    @Mutation(() => String)
    async setDemo() {
        const newValue = new Date().toISOString();
        this.configService.set('connect.demo', newValue);
        return newValue;
    }
}
