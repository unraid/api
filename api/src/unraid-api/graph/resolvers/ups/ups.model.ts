import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UPSBattery {
    /**
     * Battery charge level as a percentage (0-100)
     * Unit: percent (%)
     * Example: 100 means battery is fully charged
     */
    @Field(() => Int)
    chargeLevel!: number;

    /**
     * Estimated runtime remaining on battery power
     * Unit: seconds
     * Example: 3600 means 1 hour of runtime remaining
     */
    @Field(() => Int)
    estimatedRuntime!: number;

    /**
     * Battery health status
     * Possible values: 'Good', 'Replace', 'Unknown'
     * Indicates if the battery needs replacement
     */
    @Field()
    health!: string;
}

@ObjectType()
export class UPSPower {
    /**
     * Input voltage from the wall outlet/mains power
     * Unit: volts (V)
     * Example: 120.5 for typical US household voltage
     */
    @Field(() => Float)
    inputVoltage!: number;

    /**
     * Output voltage being delivered to connected devices
     * Unit: volts (V)
     * Example: 120.5 - should match input voltage when on mains power
     */
    @Field(() => Float)
    outputVoltage!: number;

    /**
     * Current load on the UPS as a percentage of its capacity
     * Unit: percent (%)
     * Example: 25 means UPS is loaded at 25% of its maximum capacity
     */
    @Field(() => Int)
    loadPercentage!: number;
}

@ObjectType()
export class UPSDevice {
    /**
     * Unique identifier for the UPS device
     * Usually based on the model name or a generated ID
     */
    @Field(() => ID)
    id!: string;

    /**
     * Display name for the UPS device
     * Can be customized by the user
     */
    @Field()
    name!: string;

    /**
     * UPS model name/number
     * Example: 'APC Back-UPS Pro 1500'
     */
    @Field()
    model!: string;

    /**
     * Current operational status of the UPS
     * Common values: 'Online', 'On Battery', 'Low Battery', 'Replace Battery', 'Overload', 'Offline'
     * 'Online' means running on mains power
     * 'On Battery' means running on battery backup
     */
    @Field()
    status!: string;

    /**
     * Battery-related information
     */
    @Field(() => UPSBattery)
    battery!: UPSBattery;

    /**
     * Power-related information
     */
    @Field(() => UPSPower)
    power!: UPSPower;
}

@ObjectType()
export class UPSConfiguration {
    /**
     * UPS service state
     * Values: 'enable' or 'disable'
     * Controls whether the UPS monitoring service is running
     */
    @Field({ nullable: true })
    service?: string;

    /**
     * Type of cable connecting the UPS to the server
     * Common values: 'usb', 'smart', 'ether', 'custom'
     * Determines communication protocol
     */
    @Field({ nullable: true })
    upsCable?: string;

    /**
     * Custom cable configuration string
     * Only used when upsCable is set to 'custom'
     * Format depends on specific UPS model
     */
    @Field({ nullable: true })
    customUpsCable?: string;

    /**
     * UPS communication type
     * Common values: 'usb', 'net', 'snmp', 'dumb', 'pcnet', 'modbus'
     * Defines how the server communicates with the UPS
     */
    @Field({ nullable: true })
    upsType?: string;

    /**
     * Device path or network address for UPS connection
     * Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network
     * Depends on upsType setting
     */
    @Field({ nullable: true })
    device?: string;

    /**
     * Override UPS capacity for runtime calculations
     * Unit: volt-amperes (VA)
     * Example: 1500 for a 1500VA UPS
     * Leave unset to use UPS-reported capacity
     */
    @Field(() => Int, { nullable: true })
    overrideUpsCapacity?: number;

    /**
     * Battery level threshold for shutdown
     * Unit: percent (%)
     * Example: 10 means shutdown when battery reaches 10%
     * System will shutdown when battery drops to this level
     */
    @Field(() => Int, { nullable: true })
    batteryLevel?: number;

    /**
     * Runtime threshold for shutdown
     * Unit: minutes
     * Example: 5 means shutdown when 5 minutes runtime remaining
     * System will shutdown when estimated runtime drops below this
     */
    @Field(() => Int, { nullable: true })
    minutes?: number;

    /**
     * Timeout for UPS communications
     * Unit: seconds
     * Example: 0 means no timeout
     * Time to wait for UPS response before considering it offline
     */
    @Field(() => Int, { nullable: true })
    timeout?: number;

    /**
     * Kill UPS power after shutdown
     * Values: 'yes' or 'no'
     * If 'yes', tells UPS to cut power after system shutdown
     * Useful for ensuring complete power cycle
     */
    @Field({ nullable: true })
    killUps?: string;

    /**
     * Network Information Server (NIS) IP address
     * Default: '0.0.0.0' (listen on all interfaces)
     * IP address for apcupsd network information server
     */
    @Field({ nullable: true })
    nisIp?: string;

    /**
     * Network server mode
     * Values: 'on' or 'off'
     * Enable to allow network clients to monitor this UPS
     */
    @Field({ nullable: true })
    netServer?: string;

    /**
     * UPS name for network monitoring
     * Used to identify this UPS on the network
     * Example: 'SERVER_UPS'
     */
    @Field({ nullable: true })
    upsName?: string;

    /**
     * Override UPS model name
     * Used for display purposes
     * Leave unset to use UPS-reported model
     */
    @Field({ nullable: true })
    modelName?: string;
}
