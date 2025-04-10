import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';

export enum Temperature {
    C = 'C',
    F = 'F',
}

export enum Theme {
    white = 'white',
}

registerEnumType(Temperature, {
    name: 'Temperature',
    description: 'Temperature unit (Celsius or Fahrenheit)',
});

registerEnumType(Theme, {
    name: 'Theme',
    description: 'Display theme',
});

@ObjectType()
export class Case {
    @Field(() => String, { nullable: true })
    icon?: string;

    @Field(() => String, { nullable: true })
    url?: string;

    @Field(() => String, { nullable: true })
    error?: string;

    @Field(() => String, { nullable: true })
    base64?: string;
}

@ObjectType()
export class Display implements Node {
    @Field(() => ID, { nullable: false })
    id!: string;

    @Field(() => Case, { nullable: true })
    case?: Case;

    @Field(() => String, { nullable: true })
    date?: string;

    @Field(() => String, { nullable: true })
    number?: string;

    @Field(() => Boolean, { nullable: true })
    scale?: boolean;

    @Field(() => Boolean, { nullable: true })
    tabs?: boolean;

    @Field(() => String, { nullable: true })
    users?: string;

    @Field(() => Boolean, { nullable: true })
    resize?: boolean;

    @Field(() => Boolean, { nullable: true })
    wwn?: boolean;

    @Field(() => Boolean, { nullable: true })
    total?: boolean;

    @Field(() => Boolean, { nullable: true })
    usage?: boolean;

    @Field(() => String, { nullable: true })
    banner?: string;

    @Field(() => String, { nullable: true })
    dashapps?: string;

    @Field(() => Theme, { nullable: true })
    theme?: Theme;

    @Field(() => Boolean, { nullable: true })
    text?: boolean;

    @Field(() => Temperature, { nullable: true })
    unit?: Temperature;

    @Field(() => Int, { nullable: true })
    warning?: number;

    @Field(() => Int, { nullable: true })
    critical?: number;

    @Field(() => Int, { nullable: true })
    hot?: number;

    @Field(() => Int, { nullable: true })
    max?: number;

    @Field(() => String, { nullable: true })
    locale?: string;
}

