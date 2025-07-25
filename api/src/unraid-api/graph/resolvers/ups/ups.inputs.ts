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
    /**
     * Enable or disable the UPS monitoring service
     */
    @Field(() => UPSServiceState)
    service!: UPSServiceState;

    /**
     * Type of cable connecting the UPS to the server
     */
    @Field(() => UPSCableType)
    upsCable!: UPSCableType;

    /**
     * Custom cable configuration (only used when upsCable is CUSTOM)
     * Format depends on specific UPS model
     */
    @Field({ nullable: true })
    customUpsCable?: string;

    /**
     * UPS communication protocol
     */
    @Field(() => UPSType)
    upsType!: UPSType;

    /**
     * Device path or network address for UPS connection
     * Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network
     */
    @Field({ nullable: true })
    device?: string;

    /**
     * Override UPS capacity for runtime calculations
     * Unit: watts (W)
     * Leave unset to use UPS-reported capacity
     */
    @Field(() => Int, { nullable: true })
    overrideUpsCapacity?: number;

    /**
     * Battery level percentage to initiate shutdown
     * Unit: percent (%) - Valid range: 0-100
     */
    @Field(() => Int)
    batteryLevel!: number;

    /**
     * Runtime left in minutes to initiate shutdown
     * Unit: minutes
     */
    @Field(() => Int)
    minutes!: number;

    /**
     * Time on battery before shutdown
     * Unit: seconds
     * Set to 0 to disable timeout-based shutdown
     */
    @Field(() => Int)
    timeout!: number;

    /**
     * Turn off UPS power after system shutdown
     * Useful for ensuring complete power cycle
     */
    @Field(() => UPSKillPower)
    killUps!: UPSKillPower;
}
