# Unraid API

The Unraid API provides a GraphQL interface for programmatic interaction with your Unraid server. It enables automation, monitoring, and integration capabilities.

## Current Availability

The API is available through the Unraid Connect Plugin:

1. Install Unraid Connect Plugin from Apps
2. [Configure the plugin](./how-to-use-the-api.md#enabling-the-graphql-sandbox)
3. Access API functionality through the [GraphQL Sandbox](./how-to-use-the-api.md#accessing-the-graphql-sandbox)

## Future Availability

The API will be integrated directly into the Unraid operating system in an upcoming OS release. This integration will:

- Make the API a core part of the Unraid system
- Remove the need for separate plugin installation
- Enable deeper system integration capabilities

## Documentation Sections

- [CLI Commands](./cli.md) - Reference for all available command-line interface commands
- [Using the Unraid API](./how-to-use-the-api.md) - Comprehensive guide on using the GraphQL API
- [OIDC Provider Setup](./oidc-provider-setup.md) - OIDC SSO provider configuration examples
- [Upcoming Features](./upcoming-features.md) - Roadmap of planned features and improvements

## Key Features

The API provides:

- GraphQL Interface: Modern, flexible API with strong typing
- Authentication: Secure access via API keys or session cookies
- Comprehensive Coverage: Access to system information, array management, and Docker operations
- Developer Tools: Built-in GraphQL sandbox for testing
- Role-Based Access: Granular permission control

For detailed usage instructions, see [CLI Commands](./cli.md).
