import { Transform } from 'class-transformer';
import { IsBoolean, IsHexColor, IsIn, IsOptional, IsString, IsUrl } from 'class-validator';


const sanitizeString = (value: any): any => {
    if (typeof value === 'string') {
        return value.replace(/[\\"']/g, ''); // Remove backslashes, double quotes, and single quotes
    }
    return value;
};

export class ActivationCodeDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    code?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    partnerName?: string;

    @IsOptional()
    @IsUrl()
    @Transform(({ value }) => sanitizeString(value))
    partnerUrl?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    serverName?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    sysModel?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => sanitizeString(value))
    comment?: string;

    @IsOptional()
    @IsString() // Assuming this is a file path/name
    @Transform(({ value }) => sanitizeString(value))
    caseIcon?: string;

    @IsOptional()
    @IsHexColor()
    @Transform(({ value }) => sanitizeString(value))
    header?: string;

    @IsOptional()
    @IsHexColor()
    @Transform(({ value }) => sanitizeString(value))
    headermetacolor?: string;

    @IsOptional()
    @IsHexColor()
    @Transform(({ value }) => sanitizeString(value))
    background?: string;

    @IsOptional()
    @IsIn(['yes'])
    @Transform(({ value }) => sanitizeString(value))
    showBannerGradient?: 'yes';

    @IsOptional()
    @IsIn(['azure', 'black', 'gray', 'white'])
    @Transform(({ value }) => sanitizeString(value))
    theme?: 'azure' | 'black' | 'gray' | 'white';

    @IsOptional()
    @IsBoolean()
    partnerLogo?: boolean = false;
}
