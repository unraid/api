# Unraid API

The Unraid API provides a GraphQL interface for programmatic interaction with your Unraid server. It enables automation, monitoring, and integration capabilities.

## Availability

### Native Integration (Unraid v7.2-beta.1+)

Starting with Unraid v7.2-beta.1, the API is integrated directly into the Unraid operating system:

- No plugin installation required
- Automatically available on system startup
- Deep system integration
- Access through **Settings** → **Management Access** → **API**

### Plugin Installation (Earlier Versions)

For Unraid versions prior to v7.2:

1. Install Unraid Connect Plugin from Apps
2. [Configure the plugin](./how-to-use-the-api.md#enabling-the-graphql-sandbox)
3. Access API functionality through the [GraphQL Sandbox](./how-to-use-the-api.md)

:::tip Pre-release Versions
You can install the Unraid Connect plugin on any version to access pre-release versions of the API and get early access to new features before they're included in Unraid OS releases.
:::

## Documentation Sections

- [CLI Commands](./cli.md) - Reference for all available command-line interface commands
- [Using the Unraid API](./how-to-use-the-api.md) - Comprehensive guide on using the GraphQL API
- [OIDC Provider Setup](./oidc-provider-setup.md) - OIDC SSO provider configuration examples
- [Upcoming Features](./upcoming-features.md) - Roadmap of planned features and improvements

## Key Features

The API provides:

- **GraphQL Interface**: Modern, flexible API with strong typing
- **Authentication**: Multiple methods including API keys, session cookies, and SSO/OIDC
- **Comprehensive Coverage**: Access to system information, array management, and Docker operations
- **Developer Tools**: Built-in GraphQL sandbox configurable via web interface or CLI
- **Role-Based Access**: Granular permission control
- **Web Management**: Manage API keys and settings through the web interface

For detailed usage instructions, see [CLI Commands](./cli.md).
