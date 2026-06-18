# Fan Control

Fan Control exposes fan telemetry and control mutations through GraphQL.

## Configuration

Fan Control config is stored under the `fanControl` key in your API config and persisted as `fancontrol.json` in the API config directory.

### `fanControl` Object

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Enables fan metrics/subscription wiring. |
| `control_enabled` | `boolean` | `false` | Enables write operations (`setFanSpeed`, `setFanMode`, etc.). |
| `polling_interval` | `number` | `2000` | Polling interval in milliseconds for fan metrics/curve application. |
| `control_method` | `string` | `"auto"` | Control mode metadata. |
| `safety.min_speed_percent` | `number` | `20` | Minimum allowed fan speed floor for non-CPU fans. |
| `safety.cpu_min_speed_percent` | `number` | `30` | Minimum allowed fan speed floor for CPU fans. |
| `safety.max_temp_before_full` | `number` | `85` | Emergency threshold (°C) before forcing max cooling behavior. |
| `safety.fan_failure_threshold` | `number` | `0` | RPM threshold to treat a fan as failed/stopped. |
| `zones` | `FanZoneConfig[]` | `[]` | Automatic curve zones (`fans[]`, `sensor`, `profile`). |
| `profiles` | `Record<string, FanProfileConfig>` | `{}` | Custom profiles in addition to built-ins. |

## GraphQL API

### 1) Query current fan control state

```graphql
query {
  metrics {
    fanControl {
      id
      summary {
        totalFans
        controllableFans
        averageRpm
      }
      fans {
        id
        name
        mode
        controllable
        detected
        current {
          rpm
          pwm
          targetRpm
          timestamp
        }
      }
      profiles {
        name
        description
      }
    }
  }
}
```

### 2) Discover usable temperature sensors (for zones/profile assignment)

```graphql
query {
  metrics {
    temperature {
      sensors {
        id
        name
        type
        current {
          value
          unit
        }
      }
    }
  }
}
```

Notes:
- Zone `sensor` matching accepts either sensor `id` or `name`.
- Disk/NVMe temperature sensors are available through temperature providers when enabled.

### 3) Enable fan control + set automatic zones

```graphql
mutation {
  updateFanControlConfig(
    input: {
      enabled: true
      control_enabled: true
      polling_interval: 2000
      zones: [
        {
          fans: ["hwmon-nct6798-2-fan1"]
          sensor: "coretemp-package-id-0"
          profile: "balanced"
        }
      ]
    }
  )
}
```

Built-in profile names:
- `silent`
- `balanced`
- `performance`

### 4) Manual mode and manual PWM

```graphql
mutation {
  setFanMode(input: { fanId: "hwmon-nct6798-2-fan1", mode: MANUAL })
}
```

```graphql
mutation {
  setFanSpeed(input: { fanId: "hwmon-nct6798-2-fan1", pwmValue: 160 })
}
```

### 5) Assign profile to a fan

```graphql
mutation {
  setFanProfile(
    input: {
      fanId: "hwmon-nct6798-2-fan1"
      profileName: "silent"
      temperatureSensorId: "coretemp-package-id-0"
    }
  )
}
```

### 6) Create a custom profile

```graphql
mutation {
  createFanProfile(
    input: {
      name: "mycurve"
      description: "Quiet until warm"
      curvePoints: [
        { temperature: 35, speed: 25 }
        { temperature: 55, speed: 45 }
        { temperature: 75, speed: 80 }
      ]
    }
  )
}
```

### 7) Subscription

```graphql
subscription {
  systemMetricsFanControl {
    summary {
      averageRpm
      controllableFans
    }
    fans {
      id
      name
      current {
        rpm
      }
    }
  }
}
```

## Operational notes

- `control_enabled` must be `true` for write mutations.
- `setFanSpeed`/`setFanMode` will be blocked for fans currently managed by active curve zones.
- Manual PWM range is `0..255`.
- Use `restoreAllFans` to restore original/automatic state:

```graphql
mutation {
  restoreAllFans
}
```
