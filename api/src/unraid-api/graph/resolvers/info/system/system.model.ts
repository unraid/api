import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({ implements: () => Node })
export class InfoSystem extends Node {
    @Field(() => String, { nullable: true, description: 'System manufacturer' })
    manufacturer?: string;

    @Field(() => String, { nullable: true, description: 'System model' })
    model?: string;

    @Field(() => String, { nullable: true, description: 'System version' })
    version?: string;

    @Field(() => String, { nullable: true, description: 'System serial number' })
    serial?: string;

    @Field(() => String, { nullable: true, description: 'System UUID' })
    uuid?: string;

    @Field(() => String, { nullable: true, description: 'System SKU' })
    sku?: string;

    @Field(() => Boolean, { nullable: true, description: 'Virtual machine flag' })
    virtual?: boolean;
}

@ObjectType({ implements: () => Node })
export class InfoBaseboard extends Node {
    @Field(() => String, { nullable: true, description: 'Motherboard manufacturer' })
    manufacturer?: string;

    @Field(() => String, { nullable: true, description: 'Motherboard model' })
    model?: string;

    @Field(() => String, { nullable: true, description: 'Motherboard version' })
    version?: string;

    @Field(() => String, { nullable: true, description: 'Motherboard serial number' })
    serial?: string;

    @Field(() => String, { nullable: true, description: 'Motherboard asset tag' })
    assetTag?: string;

    @Field(() => Number, { nullable: true, description: 'Maximum memory capacity in bytes' })
    memMax?: number | null;

    @Field(() => Number, { nullable: true, description: 'Number of memory slots' })
    memSlots?: number;
}
