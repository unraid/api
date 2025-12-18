# Docker Feature

The Docker feature provides complete container management for Unraid through a GraphQL API, including lifecycle operations, real-time monitoring, update detection, and organizational tools.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Module Structure](#module-structure)
  - [Data Flow](#data-flow)
- [Core Services](#core-services)
  - [DockerService](#dockerservice)
  - [DockerNetworkService](#dockernetworkservice)
  - [DockerPortService](#dockerportservice)
  - [DockerLogService](#dockerlogservice)
  - [DockerStatsService](#dockerstatsservice)
  - [DockerAutostartService](#dockerautostartservice)
  - [DockerConfigService](#dockerconfigservice)
  - [DockerManifestService](#dockermanifestservice)
  - [DockerPhpService](#dockerphpservice)
  - [DockerTailscaleService](#dockertailscaleservice)
  - [DockerTemplateScannerService](#dockertemplatescannerservice)
  - [DockerOrganizerService](#dockerorganizerservice)
- [GraphQL API](#graphql-api)
  - [Queries](#queries)
  - [Mutations](#mutations)
  - [Subscriptions](#subscriptions)
- [Data Models](#data-models)
  - [DockerContainer](#dockercontainer)
  - [ContainerState](#containerstate)
  - [ContainerPort](#containerport)
  - [DockerPortConflicts](#dockerportconflicts)
- [Caching Strategy](#caching-strategy)
- [WebGUI Integration](#webgui-integration)
  - [File Modification](#file-modification)
  - [PHP Integration](#php-integration)
- [Permissions](#permissions)
- [Configuration Files](#configuration-files)
- [Development](#development)
  - [Adding a New Docker Service](#adding-a-new-docker-service)
  - [Testing](#testing)
  - [Feature Flag Testing](#feature-flag-testing)

## Overview

**Location:** `src/unraid-api/graph/resolvers/docker/`

**Feature Flag:** Many next-generation features are gated behind `ENABLE_NEXT_DOCKER_RELEASE`. See [Feature Flags](./feature-flags.md) for details on enabling.

**Key Capabilities:**

- Container lifecycle management (start, stop, pause, update, remove)
- Real-time container stats streaming
- Network and port conflict detection
- Container log retrieval
- Automatic update detection via digest comparison
- Tailscale container integration
- Container organization with folders and views
- Template-based metadata resolution

## Architecture

### Module Structure

The Docker module (`docker.module.ts`) serves as the entry point and exports:

- **13 services** for various Docker operations
- **3 resolvers** for GraphQL query/mutation/subscription handling

**Dependencies:**

- `JobModule` - Background job scheduling
- `NotificationsModule` - User notifications
- `ServicesModule` - Shared service utilities

### Data Flow

```text
Docker Daemon (Unix Socket)
        ↓
    dockerode library
        ↓
    DockerService (transform & cache)
        ↓
    GraphQL Resolvers
        ↓
    Client Applications
```

The API communicates with the Docker daemon through the `dockerode` library via Unix socket. Container data is transformed from raw Docker API format to GraphQL types, enriched with Unraid-specific metadata (templates, autostart config), and cached for performance.

## Core Services

### DockerService

**File:** `docker.service.ts`

Central orchestrator for all container operations.

**Key Methods:**

- `getContainers(skipCache?, includeSize?)` - List containers with caching
- `start(id)`, `stop(id)`, `pause(id)`, `unpause(id)` - Lifecycle operations
- `updateContainer(id)`, `updateContainers(ids)`, `updateAllContainers()` - Image updates
- `removeContainer(id, withImage?)` - Remove container and optionally its image

**Caching:**

- Cache TTL: 60 seconds (60000ms)
- Cache keys: `docker_containers`, `docker_containers_with_size`
- Invalidated automatically on mutations

### DockerNetworkService

**File:** `docker-network.service.ts`

Lists Docker networks with metadata including driver, scope, IPAM settings, and connected containers.

**Caching:** 60 seconds

### DockerPortService

**File:** `docker-port.service.ts`

Detects port conflicts between containers and with the host.

**Features:**

- Deduplicates port mappings from Docker API
- Identifies container-to-container conflicts
- Detects host-level port collisions
- Separates TCP and UDP conflicts
- Calculates LAN-accessible IP:port combinations

### DockerLogService

**File:** `docker-log.service.ts`

Retrieves container logs with configurable options.

**Parameters:**

- `tail` - Number of lines (default: 200, max: 2000)
- `since` - Timestamp filter for log entries

**Additional Features:**

- Calculates container log file sizes
- Supports timestamp-based filtering

### DockerStatsService

**File:** `docker-stats.service.ts`

Provides real-time container statistics via GraphQL subscription.

**Metrics:**

- CPU percentage
- Memory usage and limit
- Network I/O (received/transmitted bytes)
- Block I/O (read/written bytes)

**Implementation:**

- Spawns `docker stats` process with streaming output
- Publishes to `PUBSUB_CHANNEL.DOCKER_STATS`
- Auto-starts on first subscriber, stops when last disconnects

### DockerAutostartService

**File:** `docker-autostart.service.ts`

Manages container auto-start configuration.

**Features:**

- Parses auto-start file format (name + wait time per line)
- Maintains auto-start order and wait times
- Persists configuration changes
- Tracks container primary names

### DockerConfigService

**File:** `docker-config.service.ts`

Persistent configuration management using `ConfigFilePersister`.

**Configuration Options:**

- `templateMappings` - Container name to template file path mappings
- `skipTemplatePaths` - Containers excluded from template scanning
- `updateCheckCronSchedule` - Cron expression for digest refresh (default: daily at 6am)

### DockerManifestService

**File:** `docker-manifest.service.ts`

Detects available container image updates.

**Implementation:**

- Compares local and remote image SHA256 digests
- Reads cached status from `/var/lib/docker/unraid-update-status.json`
- Triggers refresh via PHP integration

### DockerPhpService

**File:** `docker-php.service.ts`

Integration with legacy Unraid PHP Docker scripts.

**PHP Scripts Used:**

- `DockerUpdate.php` - Refresh container digests
- `DockerContainers.php` - Get update statuses

**Update Statuses:**

- `UP_TO_DATE` - Container is current
- `UPDATE_AVAILABLE` - New image available
- `REBUILD_READY` - Rebuild required
- `UNKNOWN` - Status could not be determined

### DockerTailscaleService

**File:** `docker-tailscale.service.ts`

Detects and monitors Tailscale-enabled containers.

**Detection Methods:**

- Container labels indicating Tailscale
- Tailscale socket mount points

**Status Information:**

- Tailscale version and backend state
- Hostname and DNS name
- Exit node status
- Key expiry dates

**Caching:**

- Status cache: 30 seconds
- DERP map and versions: 24 hours

### DockerTemplateScannerService

**File:** `docker-template-scanner.service.ts`

Maps containers to their template files for metadata resolution.

**Bootstrap Process:**

1. Runs 5 seconds after app startup
2. Scans XML templates from configured paths
3. Parses container/image names from XML
4. Matches against running containers
5. Stores mappings in `docker.config.json`

**Template Metadata Resolved:**

- `projectUrl`, `registryUrl`, `supportUrl`
- `iconUrl`, `webUiUrl`, `shell`
- Template port mappings

**Orphaned Containers:**

Containers without matching templates are marked as "orphaned" in the API response.

### DockerOrganizerService

**File:** `organizer/docker-organizer.service.ts`

Container organization system for UI views.

**Features:**

- Hierarchical folder structure
- Multiple views with different layouts
- Position-based organization
- View-specific preferences (sorting, filtering)

## GraphQL API

### Queries

```graphql
type Query {
  docker: Docker!
}

type Docker {
  containers(skipCache: Boolean): [DockerContainer!]!
  container(id: PrefixedID!): DockerContainer          # Feature-flagged
  networks(skipCache: Boolean): [DockerNetwork!]!
  portConflicts(skipCache: Boolean): DockerPortConflicts!
  logs(id: PrefixedID!, since: Int, tail: Int): DockerContainerLogs!
  organizer(skipCache: Boolean): DockerOrganizer!       # Feature-flagged
  containerUpdateStatuses: [ContainerUpdateStatus!]!    # Feature-flagged
}
```

### Mutations

**Container Lifecycle:**

```graphql
type Mutation {
  start(id: PrefixedID!): DockerContainer!
  stop(id: PrefixedID!): DockerContainer!
  pause(id: PrefixedID!): DockerContainer!
  unpause(id: PrefixedID!): DockerContainer!
  removeContainer(id: PrefixedID!, withImage: Boolean): Boolean!
}
```

**Container Updates:**

```graphql
type Mutation {
  updateContainer(id: PrefixedID!): DockerContainer!
  updateContainers(ids: [PrefixedID!]!): [DockerContainer!]!
  updateAllContainers: [DockerContainer!]!
  refreshDockerDigests: Boolean!
}
```

**Configuration:**

```graphql
type Mutation {
  updateAutostartConfiguration(
    entries: [AutostartEntry!]!
    persistUserPreferences: Boolean
  ): Boolean!
  syncDockerTemplatePaths: Boolean!
  resetDockerTemplateMappings: Boolean!
}
```

**Organizer (Feature-flagged):**

```graphql
type Mutation {
  createDockerFolder(name: String!, parentId: ID, childrenIds: [ID!]): DockerFolder!
  createDockerFolderWithItems(
    name: String!
    parentId: ID
    sourceEntryIds: [ID!]
    position: Int
  ): DockerFolder!
  setDockerFolderChildren(folderId: ID!, childrenIds: [ID!]!): DockerFolder!
  deleteDockerEntries(entryIds: [ID!]!): Boolean!
  moveDockerEntriesToFolder(sourceEntryIds: [ID!]!, destinationFolderId: ID!): Boolean!
  moveDockerItemsToPosition(
    sourceEntryIds: [ID!]!
    destinationFolderId: ID!
    position: Int!
  ): Boolean!
  renameDockerFolder(folderId: ID!, newName: String!): DockerFolder!
  updateDockerViewPreferences(viewId: ID!, prefs: ViewPreferencesInput!): Boolean!
}
```

### Subscriptions

```graphql
type Subscription {
  dockerContainerStats: DockerContainerStats!
}
```

Real-time container statistics stream. Automatically starts when first client subscribes and stops when last client disconnects.

## Data Models

### DockerContainer

Primary container representation with 24+ fields:

```typescript
{
  id: PrefixedID
  names: [String!]!
  image: String!
  imageId: String!
  state: ContainerState!
  status: String!
  created: Float!

  // Networking
  ports: [ContainerPort!]!
  lanIpPorts: [ContainerPort!]!
  hostConfig: ContainerHostConfig
  networkSettings: DockerNetworkSettings

  // Storage
  sizeRootFs: Float
  sizeRw: Float
  sizeLog: Float
  mounts: [ContainerMount!]!

  // Metadata
  labels: JSON

  // Auto-start
  autoStart: Boolean!
  autoStartOrder: Int
  autoStartWait: Int

  // Template Integration
  templatePath: String
  isOrphaned: Boolean!
  projectUrl: String
  registryUrl: String
  supportUrl: String
  iconUrl: String
  webUiUrl: String
  shell: String
  templatePorts: [ContainerPort!]

  // Tailscale
  tailscaleEnabled: Boolean!
  tailscaleStatus: TailscaleStatus

  // Updates
  isUpdateAvailable: Boolean
  isRebuildReady: Boolean
}
```

### ContainerState

```typescript
enum ContainerState {
  RUNNING
  PAUSED
  EXITED
}
```

### ContainerPort

```typescript
{
  ip: String
  privatePort: Int!
  publicPort: Int
  type: String!  // "tcp" or "udp"
}
```

### DockerPortConflicts

```typescript
{
  containerConflicts: [DockerContainerPortConflict!]!
  lanConflicts: [DockerLanPortConflict!]!
}
```

## Caching Strategy

The Docker feature uses `cache-manager` v7 for performance optimization.

**Important:** cache-manager v7 expects TTL values in **milliseconds**, not seconds.

| Cache Key | TTL | Invalidation |
|-----------|-----|--------------|
| `docker_containers` | 60s | On any container mutation |
| `docker_containers_with_size` | 60s | On any container mutation |
| `docker_networks` | 60s | On network changes |
| Tailscale status | 30s | Automatic |
| Tailscale DERP/versions | 24h | Automatic |

**Cache Invalidation Triggers:**

- `start()`, `stop()`, `pause()`, `unpause()`
- `updateContainer()`, `updateContainers()`, `updateAllContainers()`
- `removeContainer()`
- `updateAutostartConfiguration()`

## WebGUI Integration

### File Modification

**File:** `unraid-file-modifier/modifications/docker-containers-page.modification.ts`

**Target:** `/usr/local/emhttp/plugins/dynamix.docker.manager/DockerContainers.page`

When `ENABLE_NEXT_DOCKER_RELEASE` is enabled and Unraid version is 7.3.0+, the modification:

1. Replaces the legacy Docker containers page
2. Injects the Vue web component: `<unraid-docker-container-overview>`
3. Retains the `Nchan="docker_load"` page attribute (an emhttp/WebGUI feature for real-time updates, not controlled by the API)

### PHP Integration

The API integrates with legacy Unraid PHP scripts for certain operations:

- **Digest refresh:** Calls `DockerUpdate.php` to refresh container image digests
- **Update status:** Reads from `DockerContainers.php` output

## Permissions

All Docker operations are protected with permission checks:

| Operation | Resource | Action |
|-----------|----------|--------|
| Read containers/networks | `Resource.DOCKER` | `AuthAction.READ_ANY` |
| Start/stop/pause/update | `Resource.DOCKER` | `AuthAction.UPDATE_ANY` |
| Remove containers | `Resource.DOCKER` | `AuthAction.DELETE_ANY` |

## Configuration Files

| File | Purpose |
|------|---------|
| `docker.config.json` | Template mappings, skip paths, cron schedule |
| `docker.organizer.json` | Container organization tree and views |
| `/var/lib/docker/unraid-update-status.json` | Cached container update statuses |

## Development

### Adding a New Docker Service

1. Create service file in `src/unraid-api/graph/resolvers/docker/`
2. Add to `docker.module.ts` providers and exports
3. Inject into resolvers as needed
4. Add GraphQL types to `docker.model.ts` if needed

### Testing

```bash
# Run Docker-related tests
pnpm --filter ./api test -- src/unraid-api/graph/resolvers/docker/

# Run specific test file
pnpm --filter ./api test -- src/unraid-api/graph/resolvers/docker/docker.service.spec.ts
```

### Feature Flag Testing

To test next-generation Docker features locally:

```bash
ENABLE_NEXT_DOCKER_RELEASE=true unraid-api start
```

Or add to `.env`:

```env
ENABLE_NEXT_DOCKER_RELEASE=true
```
