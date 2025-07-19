import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

/**
 * Service state for UPS daemon
 */
export enum UPSServiceState {
    ENABLE = 'enable',
    DISABLE = 'disable',
}

/**
 * UPS cable types
 */
export enum UPSCableType {
    USB = 'usb',
    SIMPLE = 'simple',
    SMART = 'smart',
    ETHER = 'ether',
    CUSTOM = 'custom',
}

/**
 * UPS communication types
 */
export enum UPSType {
    USB = 'usb',
    APCSMART = 'apcsmart',
    NET = 'net',
    SNMP = 'snmp',
    DUMB = 'dumb',
    PCNET = 'pcnet',
    MODBUS = 'modbus',
}

/**
 * Kill UPS power after shutdown option
 */
export enum UPSKillPower {
    YES = 'yes',
    NO = 'no',
}

// Register enums with GraphQL
registerEnumType(UPSServiceState, {
    name: 'UPSServiceState',
    description: 'Service state for UPS daemon',
});

registerEnumType(UPSCableType, {
    name: 'UPSCableType',
    description: 'UPS cable connection types',
});

registerEnumType(UPSType, {
    name: 'UPSType',
    description: 'UPS communication protocols',
});

registerEnumType(UPSKillPower, {
    name: 'UPSKillPower',
    description: 'Kill UPS power after shutdown option',
});

@InputType()
export class UPSConfigInput {
    @Field(() => UPSServiceState, {
        description: 'Enable or disable the UPS monitoring service',
    })
    service!: UPSServiceState;

    @Field(() => UPSCableType, {
        description: 'Type of cable connecting the UPS to the server',
    })
    upsCable!: UPSCableType;

    @Field({
        nullable: true,
        description:
            'Custom cable configuration (only used when upsCable is CUSTOM). Format depends on specific UPS model',
    })
    customUpsCable?: string;

    @Field(() => UPSType, {
        description: 'UPS communication protocol',
    })
    upsType!: UPSType;

    @Field({
        nullable: true,
        description:
            "Device path or network address for UPS connection. Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network",
    })
    device?: string;

    @Field(() => Int, {
        nullable: true,
        description:
            'Override UPS capacity for runtime calculations. Unit: watts (W). Leave unset to use UPS-reported capacity',
    })
    overrideUpsCapacity?: number;

    @Field(() => Int, {
        description:
            'Battery level percentage to initiate shutdown. Unit: percent (%) - Valid range: 0-100',
    })
    batteryLevel!: number;

    @Field(() => Int, {
        description: 'Runtime left in minutes to initiate shutdown. Unit: minutes',
    })
    minutes!: number;

    @Field(() => Int, {
        description:
            'Time on battery before shutdown. Unit: seconds. Set to 0 to disable timeout-based shutdown',
    })
    timeout!: number;

    @Field(() => UPSKillPower, {
        description:
            'Turn off UPS power after system shutdown. Useful for ensuring complete power cycle',
    })
    killUps!: UPSKillPower;
}
