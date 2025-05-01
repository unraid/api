export type IniEnabled = 'e' | '';
export type IniNumberBoolean = '0' | '1';
export type IniStringBoolean = 'no' | 'false' | 'yes' | 'true';
export type IniStringBooleanOrAuto = 'auto' | 'no' | 'yes';

type Unit = 'C' | 'F';

interface Display {
    align: string;
    banner: string;
    critical: string;
    custom: string;
    dashapps: string;
    /** a strftime format string */
    date: string;
    /** a strftime format string */
    time?: string;
    hot: string;
    max: string;
    number: string;
    refresh: string;
    resize: string;
    scale: string;
    tabs: string;
    text: string;
    /**
     * 'black' or 'white' or 'azure' or 'gray'
     */
    theme: string;
    total: string;
    unit: Unit;
    usage: string;
    warning: string;
    wwn: string;
    locale: string;
    /**
     * hex color (without #)
     */
    headerMetaColor: string;
    /**
     * 'yes' or 'no'
     */
    showBannerGradient: string;
    /**
     * 'yes' or 'no'
     */
    headerdescription: string;
    /**
     * Header Secondary Text Color (without #)
     */
    headermetacolor: string;
    /**
     * Header Text Color (without #)
     */
    header: string;
    /**
     * Header Background Color (without #)
     */
    background: string;
    tty: string;
    raw: string;
}

/**
 * Represents [Notification Settings](http://tower.local/Settings/Notifications),
 * which live in `/boot/config/plugins/dynamix/dynamix.cfg` under the `[notify]` section.
 */
interface Notify {
    entity: string;
    normal: string;
    warning: string;
    alert: string;
    plugin: string;
    docker_notify: string;
    report: string;
    /** @deprecated (will remove in future release). Date format: DD-MM-YYYY, MM-DD-YYY, or YYYY-MM-DD */
    date: 'd-m-Y' | 'm-d-Y' | 'Y-m-d';
    /**
     * @deprecated (will remove in future release). Time format:
     * - `hi: A` => 12 hr
     * - `H:i`   => 24 hr (default)
     */
    time: 'h:i A' | 'H:i';
    position: string;
    /** path for notifications (defaults to '/tmp/notifications') */
    path: string;
    /**
     * The 'Notifications Display' field:
     * - 0 => Detailed (default)
     * - 1 => Summarized
     */
    display: '0' | '1';
    system: string;
    version: string;
    docker_update: string;
}

interface Ssmtp {
    service: string;
    root: string;
    rcptTo: string;
    setEmailPriority: string;
    subject: string;
    server: string;
    port: string;
    useTls: string;
    useStarttls: string;
    useTlsCert: string;
    authMethod: string;
    authUser: string;
    authPass: string;
}

interface Parity {
    mode: string;
    dotm: string;
    hour: string;
}

interface Remote {
    wanaccess: string;
    wanport: string;
    apikey: string;
}

export interface DynamixConfig extends Record<string, unknown> {
    display: Display;
    notify: Notify;
    ssmtp: Ssmtp;
    parity: Parity;
    remote: Remote;
}
