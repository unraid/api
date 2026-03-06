# Temperature Monitoring

The Temperature Monitoring feature allows the Unraid API to collect and expose temperature metrics from various sensors (CPU, Disks, Motherboard, etc.).

## Configuration

You can configure the temperature monitoring behavior in your `api.json`.
Nominally the `api.json` file is found at
`/boot/config/plugins/dynamix.my.servers/configs/`.

### `api.temperature` Object

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Globally enable or disable temperature monitoring. |
| `default_unit` | `string` | `"celsius"` | The unit to return values in. Options: `"celsius"`, `"fahrenheit"`, `"kelvin"`, `"rankine"`. |
| `polling_interval` | `number` | `5000` | Polling interval in milliseconds for the subscription. |
| `history.max_readings` | `number` | `1000` | (Internal) Number of historical data points to keep in memory per sensor. |
| `history.retention_ms` | `number` | `86400000` | (Internal) Retention period for historical data in milliseconds. |

### `api.temperature.sensors` Object

Enable or disable specific sensor providers.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `lm_sensors.enabled` | `boolean` | `true` | Enable `lm-sensors` provider (requires `sensors` binary). |
| `lm_sensors.config_path` | `string` | `""` | Optional path to a specific sensors config file (passed as `-c` to `sensors`). |
| `smartctl.enabled` | `boolean` | `true` | Enable disk temperature monitoring via `smartctl` (via DiskService). |
| `ipmi.enabled` | `boolean` | `true` | Enable IPMI sensor provider (requires `ipmitool`). |
| `ipmi.args` | `string[]` | `[]` | Optional array of arguments to pass to the `ipmitool` command. |

### `api.temperature.thresholds` Object

Customize warning and critical thresholds.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `warning` | `number` | `80` | Global warning threshold for other sensors. |
| `critical` | `number` | `90` | Global critical threshold for other sensors. |
| `cpu_warning` | `number` | `70` | Warning threshold for CPU. |
| `cpu_critical` | `number` | `85` | Critical threshold for CPU. |
| `disk_warning` | `number` | `50` | Warning threshold for Disks. |
| `disk_critical` | `number` | `60` | Critical threshold for Disks. |

### Sample Configuration

Example of an `api.json` configuration file:

```json
{
  "version": "4.28.2+9196778e",
  "extraOrigins": [],
  "sandbox": true,
  "ssoSubIds": [],
  "plugins": [
    "unraid-api-plugin-connect"
  ],
  "temperature": {
    "enabled": true,
    "polling_interval": 10000,
    "default_unit": "celsius",
    "history": {
      "max_readings": 144,
      "retention_ms": 86400000
    },
    "thresholds": {
      "cpu_warning": 75,
      "cpu_critical": 90,
      "disk_warning": 50,
      "disk_critical": 60
    },
    "sensors": {
      "lm_sensors": {
        "enabled": true,
        "config_path": "/etc/sensors3.conf"
      },
      "smartctl": {
        "enabled": true
      },
      "ipmi": {
        "enabled": false
      }
    }
  }
}
```

## GraphQL API

### Query: `metrics` -> `temperature`

Returns a snapshot of the current temperature metrics.

```graphql
query {
  metrics {
    temperature {
      id
      summary {
        average
        hottest {
          name
          current { value unit }
        }
      }
      sensors {
        id
        name
        type
        current {
          value
          unit
          status
        }
        history {
          value
          timestamp
        }
      }
    }
  }
}
```

### Subscription: `systemMetricsTemperature`

Subscribes to temperature updates (pushed at `polling_interval`).

```graphql
subscription {
  systemMetricsTemperature {
    summary {
      average
    }
    sensors {
      name
      current {
        value
      }
    }
  }
}
```
