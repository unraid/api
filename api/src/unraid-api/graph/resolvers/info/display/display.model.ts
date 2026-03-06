import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

import { ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';

export enum Temperature {
    CELSIUS = 'C',
    FAHRENHEIT = 'F',
}

registerEnumType(Temperature, {
    name: 'Temperature',
    description: 'Temperature unit',
});

@ObjectType({ implements: () => Node })
export class InfoDisplayCase extends Node {
    @Field(() => String, { description: 'Case image URL' })
    url!: string;

    @Field(() => String, { description: 'Case icon identifier' })
    icon!: string;

    @Field(() => String, { description: 'Error message if any' })
    error!: string;

    @Field(() => String, { description: 'Base64 encoded case image' })
    base64!: string;
}

@ObjectType({ implements: () => Node })
export class InfoDisplay extends Node {
    @Field(() => InfoDisplayCase, { description: 'Case display configuration' })
    case!: InfoDisplayCase;

    @Field(() => ThemeName, { description: 'UI theme name' })
    theme!: ThemeName;

    @Field(() => Temperature, { description: 'Temperature unit (C or F)' })
    unit!: Temperature;

    @Field(() => Boolean, { description: 'Enable UI scaling' })
    scale!: boolean;

    @Field(() => Boolean, { description: 'Show tabs in UI' })
    tabs!: boolean;

    @Field(() => Boolean, { description: 'Enable UI resize' })
    resize!: boolean;

    @Field(() => Boolean, { description: 'Show WWN identifiers' })
    wwn!: boolean;

    @Field(() => Boolean, { description: 'Show totals' })
    total!: boolean;

    @Field(() => Boolean, { description: 'Show usage statistics' })
    usage!: boolean;

    @Field(() => Boolean, { description: 'Show text labels' })
    text!: boolean;

    @Field(() => Int, { description: 'Warning temperature threshold' })
    warning!: number;

    @Field(() => Int, { description: 'Critical temperature threshold' })
    critical!: number;

    @Field(() => Int, { description: 'Hot temperature threshold' })
    hot!: number;

    @Field(() => Int, { nullable: true, description: 'Maximum temperature threshold' })
    max?: number;

    @Field(() => String, { nullable: true, description: 'Locale setting' })
    locale?: string;
}

@ObjectType()
export class Language {
    @Field(() => String, { description: 'Language code (e.g. en_US)' })
    code!: string;

    @Field(() => String, { description: 'Language description/name' })
    name!: string;

    @Field(() => String, { nullable: true, description: 'URL to the language pack XML' })
    url?: string;
}

// Export aliases for backward compatibility with the main DisplayResolver
export { InfoDisplay as Display };
export { InfoDisplayCase as DisplayCase };
