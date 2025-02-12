# Using the Unraid API

The Unraid API provides a GraphQL interface that allows you to interact with your Unraid server. This guide will help you get started with exploring and using the API.

## Enabling the GraphQL Sandbox

1. First, enable developer mode using the CLI:

    ```bash
    unraid-api developer
    ```

2. Follow the prompts to enable the sandbox. This will allow you to access the Apollo Sandbox interface.

3. Access the GraphQL playground by navigating to:

    ```txt
    http://YOUR_SERVER_IP/graphql
    ```

## Authentication

Most queries and mutations require authentication. You can authenticate using either:

1. API Keys
2. Cookies (default method when signed into the WebGUI)

### Creating an API Key

Use the CLI to create an API key:

```bash
unraid-api apikey --create
```

Follow the prompts to set:

- Name
- Description
- Roles
- Permissions

The generated API key should be included in your GraphQL requests as a header:

```json
{
    "x-api-key": "YOUR_API_KEY"
}
```

## Available Schemas

The API provides access to various aspects of your Unraid server:

### System Information

- Query system details including CPU, memory, and OS information
- Monitor system status and health
- Access baseboard and hardware information

### Array Management

- Query array status and configuration
- Manage array operations (start/stop)
- Monitor disk status and health
- Perform parity checks

### Docker Management

- List and manage Docker containers
- Monitor container status
- Manage Docker networks

### Remote Access

- Configure and manage remote access settings
- Handle SSO configuration
- Manage allowed origins

### Example Queries

1. Check System Status:

```graphql
query {
    info {
        os {
            platform
            distro
            release
            uptime
        }
        cpu {
            manufacturer
            brand
            cores
            threads
        }
    }
}
```

2. Monitor Array Status:

```graphql
query {
    array {
        state
        capacity {
            disks {
                free
                used
                total
            }
        }
        disks {
            name
            size
            status
            temp
        }
    }
}
```

3. List Docker Containers:

```graphql
query {
    dockerContainers {
        id
        names
        state
        status
        autoStart
    }
}
```

## Schema Types

The API includes several core types:

### Base Types

- `Node`: Interface for objects with unique IDs - please see [Object Identification](https://graphql.org/learn/global-object-identification/)
- `JSON`: For complex JSON data
- `DateTime`: For timestamp values
- `Long`: For 64-bit integers

### Resource Types

- `Array`: Array and disk management
- `Docker`: Container and network management
- `Info`: System information
- `Config`: Server configuration
- `Connect`: Remote access settings

### Role-Based Access

Available roles:

- `admin`: Full access
- `connect`: Remote access features
- `guest`: Limited read access

## Best Practices

1. Use the Apollo Sandbox to explore the schema and test queries
2. Start with small queries and gradually add fields as needed
3. Monitor your query complexity to maintain performance
4. Use appropriate roles and permissions for your API keys
5. Keep your API keys secure and rotate them periodically

## Rate Limiting

The API implements rate limiting to prevent abuse. Ensure your applications handle rate limit responses appropriately.

## Error Handling

The API returns standard GraphQL errors in the following format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "locations": [...],
      "path": [...]
    }
  ]
}
```

## Additional Resources

- Use the Apollo Sandbox's schema explorer to browse all available types and fields
- Check the documentation tab in Apollo Sandbox for detailed field descriptions
- Monitor the API's health using `unraid-api status`
- Generate reports using `unraid-api report` for troubleshooting

For more information about specific commands and configuration options, refer to the CLI documentation or run `unraid-api --help`.
