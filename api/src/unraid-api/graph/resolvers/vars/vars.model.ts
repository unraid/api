import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

import {
    RegistrationState,
    RegistrationType,
} from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

export enum ConfigErrorState {
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    INELIGIBLE = 'INELIGIBLE',
    INVALID = 'INVALID',
    NO_KEY_SERVER = 'NO_KEY_SERVER',
    WITHDRAWN = 'WITHDRAWN',
}

registerEnumType(ConfigErrorState, {
    name: 'ConfigErrorState',
    description: 'Possible error states for configuration',
});

export enum MdState {
    SWAP_DSBL = 'SWAP_DSBL',
    STARTED = 'STARTED',
}

registerEnumType(MdState, {
    name: 'MdState',
    description: 'Possible states for MD (Multiple Device)',
});

@ObjectType({
    implements: () => Node,
})
export class Vars extends Node {
    @Field({ nullable: true, description: 'Unraid version' })
    version?: string;

    @Field(() => Int, { nullable: true })
    maxArraysz?: number;

    @Field(() => Int, { nullable: true })
    maxCachesz?: number;

    @Field({ nullable: true, description: 'Machine hostname' })
    name?: string;

    @Field({ nullable: true })
    timeZone?: string;

    @Field({ nullable: true })
    comment?: string;

    @Field({ nullable: true })
    security?: string;

    @Field({ nullable: true })
    workgroup?: string;

    @Field({ nullable: true })
    domain?: string;

    @Field({ nullable: true })
    domainShort?: string;

    @Field({ nullable: true })
    hideDotFiles?: boolean;

    @Field({ nullable: true })
    localMaster?: boolean;

    @Field({ nullable: true })
    enableFruit?: string;

    @Field({ nullable: true, description: 'Should a NTP server be used for time sync?' })
    useNtp?: boolean;

    @Field({ nullable: true, description: 'NTP Server 1' })
    ntpServer1?: string;

    @Field({ nullable: true, description: 'NTP Server 2' })
    ntpServer2?: string;

    @Field({ nullable: true, description: 'NTP Server 3' })
    ntpServer3?: string;

    @Field({ nullable: true, description: 'NTP Server 4' })
    ntpServer4?: string;

    @Field({ nullable: true })
    domainLogin?: string;

    @Field({ nullable: true })
    sysModel?: string;

    @Field(() => Int, { nullable: true })
    sysArraySlots?: number;

    @Field(() => Int, { nullable: true })
    sysCacheSlots?: number;

    @Field(() => Int, { nullable: true })
    sysFlashSlots?: number;

    @Field({ nullable: true })
    useSsl?: boolean;

    @Field(() => Int, { nullable: true, description: 'Port for the webui via HTTP' })
    port?: number;

    @Field(() => Int, { nullable: true, description: 'Port for the webui via HTTPS' })
    portssl?: number;

    @Field({ nullable: true })
    localTld?: string;

    @Field({ nullable: true })
    bindMgt?: boolean;

    @Field({ nullable: true, description: 'Should telnet be enabled?' })
    useTelnet?: boolean;

    @Field(() => Int, { nullable: true })
    porttelnet?: number;

    @Field({ nullable: true })
    useSsh?: boolean;

    @Field(() => Int, { nullable: true })
    portssh?: number;

    @Field({ nullable: true })
    startPage?: string;

    @Field({ nullable: true })
    startArray?: boolean;

    @Field({ nullable: true })
    spindownDelay?: string;

    @Field({ nullable: true })
    queueDepth?: string;

    @Field({ nullable: true })
    spinupGroups?: boolean;

    @Field({ nullable: true })
    defaultFormat?: string;

    @Field({ nullable: true })
    defaultFsType?: string;

    @Field(() => Int, { nullable: true })
    shutdownTimeout?: number;

    @Field({ nullable: true })
    luksKeyfile?: string;

    @Field({ nullable: true })
    pollAttributes?: string;

    @Field({ nullable: true })
    pollAttributesDefault?: string;

    @Field({ nullable: true })
    pollAttributesStatus?: string;

    @Field(() => Int, { nullable: true })
    nrRequests?: number;

    @Field(() => Int, { nullable: true })
    nrRequestsDefault?: number;

    @Field({ nullable: true })
    nrRequestsStatus?: string;

    @Field(() => Int, { nullable: true })
    mdNumStripes?: number;

    @Field(() => Int, { nullable: true })
    mdNumStripesDefault?: number;

    @Field({ nullable: true })
    mdNumStripesStatus?: string;

    @Field(() => Int, { nullable: true })
    mdSyncWindow?: number;

    @Field(() => Int, { nullable: true })
    mdSyncWindowDefault?: number;

    @Field({ nullable: true })
    mdSyncWindowStatus?: string;

    @Field(() => Int, { nullable: true })
    mdSyncThresh?: number;

    @Field(() => Int, { nullable: true })
    mdSyncThreshDefault?: number;

    @Field({ nullable: true })
    mdSyncThreshStatus?: string;

    @Field(() => Int, { nullable: true })
    mdWriteMethod?: number;

    @Field({ nullable: true })
    mdWriteMethodDefault?: string;

    @Field({ nullable: true })
    mdWriteMethodStatus?: string;

    @Field({ nullable: true })
    shareDisk?: string;

    @Field({ nullable: true })
    shareUser?: string;

    @Field({ nullable: true })
    shareUserInclude?: string;

    @Field({ nullable: true })
    shareUserExclude?: string;

    @Field({ nullable: true })
    shareSmbEnabled?: boolean;

    @Field({ nullable: true })
    shareNfsEnabled?: boolean;

    @Field({ nullable: true })
    shareAfpEnabled?: boolean;

    @Field({ nullable: true })
    shareInitialOwner?: string;

    @Field({ nullable: true })
    shareInitialGroup?: string;

    @Field({ nullable: true })
    shareCacheEnabled?: boolean;

    @Field({ nullable: true })
    shareCacheFloor?: string;

    @Field({ nullable: true })
    shareMoverSchedule?: string;

    @Field({ nullable: true })
    shareMoverLogging?: boolean;

    @Field({ nullable: true })
    fuseRemember?: string;

    @Field({ nullable: true })
    fuseRememberDefault?: string;

    @Field({ nullable: true })
    fuseRememberStatus?: string;

    @Field({ nullable: true })
    fuseDirectio?: string;

    @Field({ nullable: true })
    fuseDirectioDefault?: string;

    @Field({ nullable: true })
    fuseDirectioStatus?: string;

    @Field({ nullable: true })
    shareAvahiEnabled?: boolean;

    @Field({ nullable: true })
    shareAvahiSmbName?: string;

    @Field({ nullable: true })
    shareAvahiSmbModel?: string;

    @Field({ nullable: true })
    shareAvahiAfpName?: string;

    @Field({ nullable: true })
    shareAvahiAfpModel?: string;

    @Field({ nullable: true })
    safeMode?: boolean;

    @Field({ nullable: true })
    startMode?: string;

    @Field({ nullable: true })
    configValid?: boolean;

    @Field(() => ConfigErrorState, { nullable: true })
    configError?: ConfigErrorState;

    @Field({ nullable: true })
    joinStatus?: string;

    @Field(() => Int, { nullable: true })
    deviceCount?: number;

    @Field({ nullable: true })
    flashGuid?: string;

    @Field({ nullable: true })
    flashProduct?: string;

    @Field({ nullable: true })
    flashVendor?: string;

    @Field({ nullable: true })
    regCheck?: string;

    @Field({ nullable: true })
    regFile?: string;

    @Field({ nullable: true })
    regGuid?: string;

    @Field(() => RegistrationType, { nullable: true })
    regTy?: RegistrationType;

    @Field(() => RegistrationState, { nullable: true })
    regState?: RegistrationState;

    @Field({ nullable: true, description: 'Registration owner' })
    regTo?: string;

    @Field({ nullable: true })
    regTm?: string;

    @Field({ nullable: true })
    regTm2?: string;

    @Field({ nullable: true })
    regGen?: string;

    @Field({ nullable: true })
    sbName?: string;

    @Field({ nullable: true })
    sbVersion?: string;

    @Field({ nullable: true })
    sbUpdated?: string;

    @Field(() => Int, { nullable: true })
    sbEvents?: number;

    @Field({ nullable: true })
    sbState?: string;

    @Field({ nullable: true })
    sbClean?: boolean;

    @Field(() => Int, { nullable: true })
    sbSynced?: number;

    @Field(() => Int, { nullable: true })
    sbSyncErrs?: number;

    @Field(() => Int, { nullable: true })
    sbSynced2?: number;

    @Field({ nullable: true })
    sbSyncExit?: string;

    @Field(() => Int, { nullable: true })
    sbNumDisks?: number;

    @Field({ nullable: true })
    mdColor?: string;

    @Field(() => Int, { nullable: true })
    mdNumDisks?: number;

    @Field(() => Int, { nullable: true })
    mdNumDisabled?: number;

    @Field(() => Int, { nullable: true })
    mdNumInvalid?: number;

    @Field(() => Int, { nullable: true })
    mdNumMissing?: number;

    @Field(() => Int, { nullable: true })
    mdNumNew?: number;

    @Field(() => Int, { nullable: true })
    mdNumErased?: number;

    @Field(() => Int, { nullable: true })
    mdResync?: number;

    @Field({ nullable: true })
    mdResyncCorr?: string;

    @Field({ nullable: true })
    mdResyncPos?: string;

    @Field({ nullable: true })
    mdResyncDb?: string;

    @Field({ nullable: true })
    mdResyncDt?: string;

    @Field({ nullable: true })
    mdResyncAction?: string;

    @Field(() => Int, { nullable: true })
    mdResyncSize?: number;

    @Field({ nullable: true })
    mdState?: string;

    @Field({ nullable: true })
    mdVersion?: string;

    @Field(() => Int, { nullable: true })
    cacheNumDevices?: number;

    @Field(() => Int, { nullable: true })
    cacheSbNumDisks?: number;

    @Field({ nullable: true })
    fsState?: string;

    @Field({ nullable: true, description: 'Human friendly string of array events happening' })
    fsProgress?: string;

    @Field(() => Int, {
        nullable: true,
        description: 'Percentage from 0 - 100 while upgrading a disk or swapping parity drives',
    })
    fsCopyPrcnt?: number;

    @Field(() => Int, { nullable: true })
    fsNumMounted?: number;

    @Field(() => Int, { nullable: true })
    fsNumUnmountable?: number;

    @Field({ nullable: true })
    fsUnmountableMask?: string;

    @Field(() => Int, { nullable: true, description: 'Total amount of user shares' })
    shareCount?: number;

    @Field(() => Int, { nullable: true, description: 'Total amount shares with SMB enabled' })
    shareSmbCount?: number;

    @Field(() => Int, { nullable: true, description: 'Total amount shares with NFS enabled' })
    shareNfsCount?: number;

    @Field(() => Int, { nullable: true, description: 'Total amount shares with AFP enabled' })
    shareAfpCount?: number;

    @Field({ nullable: true })
    shareMoverActive?: boolean;

    @Field({ nullable: true })
    csrfToken?: string;
}

@InputType()
export class UpdateSshInput {
    @Field()
    @IsBoolean()
    enabled!: boolean;

    @Field(() => Int, { description: 'SSH Port (default 22)' })
    @IsInt()
    @Min(1)
    @Max(65535)
    port!: number;
}
