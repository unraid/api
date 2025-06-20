import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { IsBoolean, IsHexColor, IsOptional, IsString } from 'class-validator';

export enum ThemeName {
    azure = 'azure',
    black = 'black',
    gray = 'gray',
    white = 'white',
}

registerEnumType(ThemeName, {
    name: 'ThemeName',
    description: 'The theme name',
});

@ObjectType()
export class Theme {
    @Field(() => ThemeName, { description: 'The theme name' })
    @IsString()
    name!: ThemeName;

    @Field(() => Boolean, { description: 'Whether to show the header banner image' })
    @IsBoolean()
    showBannerImage: boolean = false;

    @Field(() => Boolean, { description: 'Whether to show the banner gradient' })
    @IsBoolean()
    showBannerGradient: boolean = false;

    @Field(() => Boolean, { description: 'Whether to show the description in the header' })
    @IsBoolean()
    showHeaderDescription: boolean = true;

    @Field(() => String, { description: 'The background color of the header', nullable: true })
    @IsOptional()
    @IsString()
    @IsHexColor()
    headerBackgroundColor?: string;

    @Field(() => String, { description: 'The text color of the header', nullable: true })
    @IsOptional()
    @IsString()
    @IsHexColor()
    headerPrimaryTextColor?: string;

    @Field(() => String, { description: 'The secondary text color of the header', nullable: true })
    @IsOptional()
    @IsString()
    @IsHexColor()
    headerSecondaryTextColor?: string;
}
