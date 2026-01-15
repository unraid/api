import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UPSBattery {
    @Field(() => Int, {
        description:
            'Battery charge level as a percentage (0-100). Unit: percent (%). Example: 100 means battery is fully charged',
    })
    chargeLevel!: number;

    @Field(() => Int, {
        description:
            'Estimated runtime remaining on battery power. Unit: seconds. Example: 3600 means 1 hour of runtime remaining',
    })
    estimatedRuntime!: number;

    @Field({
        description:
            "Battery health status. Possible values: 'Good', 'Replace', 'Unknown'. Indicates if the battery needs replacement",
    })
    health!: string;
}

@ObjectType()
export class UPSPower {
    @Field(() => Float, {
        description:
            'Input voltage from the wall outlet/mains power. Unit: volts (V). Example: 120.5 for typical US household voltage',
    })
    inputVoltage!: number;

    @Field(() => Float, {
        description:
            'Output voltage being delivered to connected devices. Unit: volts (V). Example: 120.5 - should match input voltage when on mains power',
    })
    outputVoltage!: number;

    @Field(() => Int, {
        description:
            'Current load on the UPS as a percentage of its capacity. Unit: percent (%). Example: 25 means UPS is loaded at 25% of its maximum capacity',
    })
    loadPercentage!: number;

    @Field(() => Int, {
        nullable: true,
        description:
            'Nominal power capacity of the UPS. Unit: watts (W). Example: 1000 means the UPS is rated for 1000 watts. This is the maximum power the UPS can deliver',
    })
    nominalPower?: number;

    @Field(() => Float, {
        nullable: true,
        description:
            'Current power consumption calculated from load percentage and nominal power. Unit: watts (W). Example: 350 means 350 watts currently being used. Calculated as: nominalPower * (loadPercentage / 100)',
    })
    currentPower?: number;
}

@ObjectType()
export class UPSDevice {
    @Field(() => ID, {
        description:
            'Unique identifier for the UPS device. Usually based on the model name or a generated ID',
    })
    id!: string;

    @Field({ description: 'Display name for the UPS device. Can be customized by the user' })
    name!: string;

    @Field({ description: "UPS model name/number. Example: 'APC Back-UPS Pro 1500'" })
    model!: string;

    @Field({
        description:
            "Current operational status of the UPS. Common values: 'Online', 'On Battery', 'Low Battery', 'Replace Battery', 'Overload', 'Offline'. 'Online' means running on mains power, 'On Battery' means running on battery backup",
    })
    status!: string;

    @Field(() => UPSBattery, { description: 'Battery-related information' })
    battery!: UPSBattery;

    @Field(() => UPSPower, { description: 'Power-related information' })
    power!: UPSPower;
}

@ObjectType()
export class UPSConfiguration {
    @Field({
        nullable: true,
        description:
            "UPS service state. Values: 'enable' or 'disable'. Controls whether the UPS monitoring service is running",
    })
    service?: string;

    @Field({
        nullable: true,
        description:
            "Type of cable connecting the UPS to the server. Common values: 'usb', 'smart', 'ether', 'custom'. Determines communication protocol",
    })
    upsCable?: string;

    @Field({
        nullable: true,
        description:
            "Custom cable configuration string. Only used when upsCable is set to 'custom'. Format depends on specific UPS model",
    })
    customUpsCable?: string;

    @Field({
        nullable: true,
        description:
            "UPS communication type. Common values: 'usb', 'net', 'snmp', 'dumb', 'pcnet', 'modbus'. Defines how the server communicates with the UPS",
    })
    upsType?: string;

    @Field({
        nullable: true,
        description:
            "Device path or network address for UPS connection. Examples: '/dev/ttyUSB0' for USB, '192.168.1.100:3551' for network. Depends on upsType setting",
    })
    device?: string;

    @Field(() => Int, {
        nullable: true,
        description:
            'Override UPS capacity for runtime calculations. Unit: volt-amperes (VA). Example: 1500 for a 1500VA UPS. Leave unset to use UPS-reported capacity',
    })
    overrideUpsCapacity?: number;

    @Field(() => Int, {
        nullable: true,
        description:
            'Battery level threshold for shutdown. Unit: percent (%). Example: 10 means shutdown when battery reaches 10%. System will shutdown when battery drops to this level',
    })
    batteryLevel?: number;

    @Field(() => Int, {
        nullable: true,
        description:
            'Runtime threshold for shutdown. Unit: minutes. Example: 5 means shutdown when 5 minutes runtime remaining. System will shutdown when estimated runtime drops below this',
    })
    minutes?: number;

    @Field(() => Int, {
        nullable: true,
        description:
            'Timeout for UPS communications. Unit: seconds. Example: 0 means no timeout. Time to wait for UPS response before considering it offline',
    })
    timeout?: number;

    @Field({
        nullable: true,
        description:
            "Kill UPS power after shutdown. Values: 'yes' or 'no'. If 'yes', tells UPS to cut power after system shutdown. Useful for ensuring complete power cycle",
    })
    killUps?: string;

    @Field({
        nullable: true,
        description:
            "Network Information Server (NIS) IP address. Default: '0.0.0.0' (listen on all interfaces). IP address for apcupsd network information server",
    })
    nisIp?: string;

    @Field({
        nullable: true,
        description:
            "Network server mode. Values: 'on' or 'off'. Enable to allow network clients to monitor this UPS",
    })
    netServer?: string;

    @Field({
        nullable: true,
        description:
            "UPS name for network monitoring. Used to identify this UPS on the network. Example: 'SERVER_UPS'",
    })
    upsName?: string;

    @Field({
        nullable: true,
        description:
            'Override UPS model name. Used for display purposes. Leave unset to use UPS-reported model',
    })
    modelName?: string;
}
