---
title: Welcome to Unraid API
description: The official GraphQL API for Unraid Server management and automation
sidebar_position: 1
---

# Welcome to Unraid API

:::tip[What's New]
Native integration in Unraid v7.2+ brings the API directly into the OS - no plugin needed!
:::

The Unraid API provides a GraphQL interface for programmatic interaction with your Unraid server. It enables automation, monitoring, and integration capabilities.

## 📦 Availability

### ✨ Native Integration (Unraid v7.2-beta.1+)

Starting with Unraid v7.2-beta.1, the API is integrated directly into the Unraid operating system:

- No plugin installation required
- Automatically available on system startup
- Deep system integration
- Access through **Settings** → **Management Access** → **API**

### 🔌 Plugin Installation (Earlier Versions)

For Unraid versions prior to v7.2:

1. Install Unraid Connect Plugin from Apps
2. [Configure the plugin](./how-to-use-the-api.md#enabling-the-graphql-sandbox)
3. Access API functionality through the [GraphQL Sandbox](./how-to-use-the-api.md)

:::tip Pre-release Versions
You can install the Unraid Connect plugin on any version to access pre-release versions of the API and get early access to new features before they're included in Unraid OS releases.
:::

## 📚 Documentation Sections

<cards>
<card title="CLI Commands" icon="terminal" href="./cli">
  Complete reference for all CLI commands
</card>
<card title="Using the API" icon="code" href="./how-to-use-the-api">
  Learn how to interact with the GraphQL API
</card>
<card title="OIDC Setup" icon="shield" href="./oidc-provider-setup">
  Configure SSO authentication providers
</card>
<card title="Upcoming Features" icon="rocket" href="./upcoming-features">
  See what's coming next
</card>
</cards>


## 🌟 Key Features

:::info[Core Capabilities]
The API provides:

- **GraphQL Interface**: Modern, flexible API with strong typing
- **Authentication**: Multiple methods including API keys, session cookies, and SSO/OIDC
- **Comprehensive Coverage**: Access to system information, array management, and Docker operations
- **Developer Tools**: Built-in GraphQL sandbox configurable via web interface or CLI
- **Role-Based Access**: Granular permission control
- **Web Management**: Manage API keys and settings through the web interface
:::

## 🚀 Get Started

<tabs>
<tabItem value="v72" label="Unraid v7.2+" default>

1. Access the API settings at **Settings** → **Management Access** → **API**
2. Enable the GraphQL Sandbox for development
3. Create your first API key
4. Start making GraphQL queries!

</tabItem>
<tabItem value="older" label="Earlier Versions">

1. Install the Unraid Connect plugin from Apps
2. Configure the plugin settings
3. Enable the GraphQL Sandbox
4. Start exploring the API!

</tabItem>
</tabs>

For detailed usage instructions, see the [CLI Commands](./cli) reference.
