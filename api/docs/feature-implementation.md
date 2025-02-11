# Unraid API Project Status

This document outlines the current implementation status of various Unraid components in the API.

## Implementation Status Legend

- ✅ Fully Implemented
- 🟡 Partially Implemented
- ❌ Not Implemented
- 🔒 Requires Authentication

## Core Components

| Component | Read | Write | Update | Notes |
|-----------|------|-------|--------|-------|
| Array | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Full array management including start/stop/status |
| Parity | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Check/pause/resume functionality |
| Disks | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Comprehensive disk management |
| Docker | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Container and network management |

## System Information

| Component | Read | Write | Notes |
|-----------|------|-------|-------|
| CPU | ✅ | ❌ | Detailed CPU information including cores, cache, flags |
| Memory | ✅ | ❌ | RAM and swap information |
| OS | ✅ | ❌ | System version and kernel details |
| Hardware | ✅ | ❌ | Baseboard and system information |
| Network | ✅ | 🟡 | Basic network interface information |

## Configuration & Management

| Component | Read | Write | Update | Notes |
|-----------|------|-------|--------|-------|
| API Keys | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Full CRUD operations |
| SSO | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Complete SSO integration |
| Remote Access | ✅ 🔒 | ✅ 🔒 | ✅ 🔒 | Dynamic and static access configuration |
| Display Settings | ✅ 🔒 | 🟡 | 🟡 | Basic display configuration |

## Device Management

| Component | Read | Write | Notes |
|-----------|------|-------|-------|
| GPU | ✅ | ❌ | Basic GPU information |
| USB Devices | ✅ | ❌ | Basic USB device enumeration |
| PCI Devices | ✅ | ❌ | PCI device information |
| Storage Devices | ✅ | 🟡 | Comprehensive storage information |

## Security & Authentication

| Feature | Status | Notes |
|---------|--------|-------|
| Role-Based Access | ✅ | Implemented roles: admin, connect, guest |
| API Key Authentication | ✅ | Full implementation with key management |
| Permission System | ✅ | Granular resource-based permissions |
| Rate Limiting | ✅ | Implemented with configurable limits |

## Available Resources

The following resources are available for API access:

```typescript
enum Resource {
    api_key
    array
    cloud
    config
    connect
    connect__remote_access
    customizations
    dashboard
    disk
    display
    docker
    flash
    info
    logs
    me
    network
    notifications
    online
    os
    owner
    permission
    registration
    servers
    services
    share
    vars
    vms
    welcome
}
```

## Authentication Methods

1. API Key Authentication
   - Header-based authentication
   - Role-based access control
   - Granular permissions

2. Session-based Authentication
   - Cookie-based authentication
   - CSRF protection
   - Integration with Unraid's existing auth system

## Rate Limiting

Current implementation:
- 100 requests per 10 seconds per IP
- Configurable through ThrottlerModule

## Development Features

| Feature | Status | Notes |
|---------|--------|-------|
| GraphQL Sandbox | ✅ | Available in developer mode |
| CLI Tools | ✅ | Comprehensive command line interface |
| Error Handling | ✅ | Standardized error responses |
| Logging | ✅ | Configurable log levels |

## Notes

1. All authenticated endpoints require either:
   - Valid API key in X-API-Key header
   - Valid session cookie with CSRF token

2. Resource access is controlled by:
   - User roles
   - Individual permissions
   - Resource-specific policies

3. The API implements standard GraphQL features:
   - Queries for reading data
   - Mutations for writing/updating data
   - Subscriptions for real-time updates
