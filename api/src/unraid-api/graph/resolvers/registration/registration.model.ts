import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

export enum RegistrationType {
    BASIC = 'BASIC',
    PLUS = 'PLUS',
    PRO = 'PRO',
    STARTER = 'STARTER',
    UNLEASHED = 'UNLEASHED',
    LIFETIME = 'LIFETIME',
    INVALID = 'INVALID',
    TRIAL = 'TRIAL',
}

export enum RegistrationState {
    /** Trial license */
    TRIAL = 'TRIAL',
    /** Basic license */
    BASIC = 'BASIC',
    /** Plus license */
    PLUS = 'PLUS',
    /** Pro license */
    PRO = 'PRO',
    /** Starter license */
    STARTER = 'STARTER',
    /** Unleashed license */
    UNLEASHED = 'UNLEASHED',
    /** Lifetime license */
    LIFETIME = 'LIFETIME',
    /** Trial Expired */
    EEXPIRED = 'EEXPIRED',
    /** GUID Error */
    EGUID = 'EGUID',
    /** Multiple License Keys Present */
    EGUID1 = 'EGUID1',
    /** Invalid installation */
    ETRIAL = 'ETRIAL',
    /** No Keyfile */
    ENOKEYFILE = 'ENOKEYFILE',
    /** No Keyfile */
    ENOKEYFILE1 = 'ENOKEYFILE1',
    /** Missing key file */
    ENOKEYFILE2 = 'ENOKEYFILE2',
    /** No Flash */
    ENOFLASH = 'ENOFLASH',
    /** No Flash */
    ENOFLASH1 = 'ENOFLASH1',
    /** No Flash */
    ENOFLASH2 = 'ENOFLASH2',
    /** No Flash */
    ENOFLASH3 = 'ENOFLASH3',
    /** No Flash */
    ENOFLASH4 = 'ENOFLASH4',
    /** No Flash */
    ENOFLASH5 = 'ENOFLASH5',
    /** No Flash */
    ENOFLASH6 = 'ENOFLASH6',
    /** No Flash */
    ENOFLASH7 = 'ENOFLASH7',
    /** BLACKLISTED */
    EBLACKLISTED = 'EBLACKLISTED',
    /** BLACKLISTED */
    EBLACKLISTED1 = 'EBLACKLISTED1',
    /** BLACKLISTED */
    EBLACKLISTED2 = 'EBLACKLISTED2',
    /** Trial Requires Internet Connection */
    ENOCONN = 'ENOCONN',
}

registerEnumType(RegistrationType, {
    name: 'registrationType',
});

registerEnumType(RegistrationState, {
    name: 'RegistrationState',
});

@ObjectType()
export class KeyFile {
    @Field(() => String, { nullable: true })
    location?: string;

    @Field(() => String, { nullable: true })
    contents?: string;
}

@ObjectType({ implements: () => Node })
export class Registration implements Node {
    @Field(() => PrefixedID)
    id!: string;

    @Field(() => RegistrationType, { nullable: true })
    type?: RegistrationType;

    @Field(() => KeyFile, { nullable: true })
    keyFile?: KeyFile;

    @Field(() => RegistrationState, { nullable: true })
    state?: RegistrationState;

    @Field(() => String, { nullable: true })
    expiration?: string;

    @Field(() => String, { nullable: true })
    updateExpiration?: string;
}
