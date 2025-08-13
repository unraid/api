# OIDC Provider Configuration Guide

This guide walks you through configuring OIDC (OpenID Connect) providers in the Unraid API using the web interface.

## Table of Contents

- [Accessing OIDC Settings](#accessing-oidc-settings)
- [Understanding Authorization Modes](#understanding-authorization-modes)
- [Provider Configuration Examples](#provider-configuration-examples)
    - [Unraid.net Provider](#unraidnet-provider)
    - [Google](#google)
    - [Authelia](#authelia)
    - [Microsoft/Azure AD](#microsoftazure-ad)
    - [Keycloak](#keycloak)
    - [Authentik](#authentik)
    - [Okta](#okta)
- [Authorization Rules](#authorization-rules)
- [Troubleshooting](#troubleshooting)

## Accessing OIDC Settings

1. Navigate to your Unraid server's web interface
2. The OIDC Providers section is available on the main configuration page
3. You'll see tabs for different providers - click the **+** button to add a new provider

### OIDC Providers Interface Overview

![OIDC Providers Main Interface](./images/oidc-main-interface.png)
_Screenshot: OIDC Providers configuration showing Unraid.net and Google tabs with Simple Authorization mode_

The interface includes:

- **Provider tabs**: Each configured provider (Unraid.net, Google, etc.) appears as a tab
- **Add Provider button**: Click the **+** button to add new providers
- **Authorization Mode dropdown**: Toggle between "simple" and "advanced" modes
- **Simple Authorization section**: Configure allowed email domains and specific addresses
- **Add Item buttons**: Click to add multiple authorization rules

## Understanding Authorization Modes

The interface provides two authorization modes:

### Simple Mode (Recommended)

Simple mode is the easiest way to configure authorization. You can:

- Allow specific email domains (e.g., @company.com)
- Allow specific email addresses
- Configure who can access your Unraid server with minimal setup

**When to use Simple Mode:**

- You want to allow all users from your company domain
- You have a small list of specific users
- You're new to OIDC configuration

### Advanced Mode

Advanced mode provides granular control using claim-based rules. You can:

- Create complex authorization rules based on JWT claims
- Use operators like equals, contains, endsWith, startsWith
- Combine multiple conditions

**When to use Advanced Mode:**

- You need to check group memberships
- You want to verify multiple claims (e.g., email domain AND verified status)
- You have complex authorization requirements

## Provider Configuration Examples

### Unraid.net Provider

![Unraid.net Provider Configuration](./images/unraid-net-provider.png)
_Screenshot: Unraid.net provider tab showing Simple Authorization configuration_

The Unraid.net provider is built-in and pre-configured. You only need to modify the authorization rules.

**To configure authorization:**

1. Select the **Unraid.net** tab
2. Under **Authorization Mode**, select "simple" from the dropdown
3. In **Simple Authorization** section you'll see:
    - **Allowed Email Domains**: Enter domains without @ symbol (e.g., `company.com`)
    - **Specific Email Addresses**: Add individual email addresses for specific users
4. Click **Add Item** to add more domains or addresses
5. Click **Save** to apply changes

> ⚠️ **Important**: The Unraid.net provider is built-in. You'll see a warning message stating "This is the built-in Unraid.net provider. Only authorization rules can be modified."

### Google

![Google Provider Configuration](./images/google-provider-config.png)
_Screenshot: Google provider configuration form with all required fields_

#### Step 1: Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure:
    - Application type: **Web application**
    - Name: **Unraid SSO**
    - Authorized JavaScript origins: `http://YOUR_UNRAID_IP:3001`
    - Authorized redirect URIs: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`
6. Save your **Client ID** and **Client Secret**

#### Step 2: Configure in Unraid

![Add New Provider](./images/add-new-provider.png)
_Screenshot: Adding a new OIDC provider - Google configuration example_

1. Click the **+** button to add a new provider
2. Fill in the following fields:

**Basic Information:**

- **Provider ID**: `google` (or any unique identifier)
- **Display Name**: `Google`
- **Client ID**: Your Google OAuth client ID
- **Client Secret**: Your Google OAuth client secret
- **Issuer URL**: `https://accounts.google.com`

**Scopes:** (Add these one by one)

- `openid`
- `profile`
- `email`

**Authorization (Simple Mode):**

- **Allowed Email Domains**: Add your company domain (e.g., `company.com`)
- **Specific Email Addresses**: Add individual emails if needed

**Button Customization (Optional):**

- **Button Text**: `Sign in with Google`
- **Button Icon**: `https://www.google.com/favicon.ico`
- **Button Style**: Choose from available variants

3. Click **Save**

#### For Google Workspace

If using Google Workspace, you can use Advanced Mode to check the hosted domain:

1. Switch to **Advanced Mode**
2. Add a rule:
    - **Claim**: `hd`
    - **Operator**: `equals`
    - **Value**: `your-domain.com`

### Authelia

![Authelia Provider Configuration](./images/authelia-provider.png)
_Screenshot: Authelia provider configuration with group-based authorization_

Authelia is perfect for self-hosted authentication.

#### Step 1: Configure Authelia

Add this to your Authelia `configuration.yml`:

```yaml
identity_providers:
    oidc:
        clients:
            - id: unraid-api
              description: Unraid API
              secret: '$pbkdf2-sha512$310000$YOUR_HASHED_SECRET'
              authorization_policy: two_factor
              redirect_uris:
                  - http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback
              scopes:
                  - openid
                  - profile
                  - email
                  - groups
```

Generate the hashed secret:

```bash
docker run authelia/authelia:latest authelia hash-password 'your-secret'
```

#### Step 2: Configure in Unraid

1. Add a new provider with the **+** button
2. Fill in:

**Basic Information:**

- **Provider ID**: `authelia`
- **Display Name**: `Authelia`
- **Client ID**: `unraid-api`
- **Client Secret**: Your unhashed secret
- **Issuer URL**: `https://auth.yourdomain.com`

**Scopes:**

- `openid`
- `profile`
- `email`
- `groups`

**Authorization:**

For Simple Mode:

- Add allowed email domains

For Advanced Mode (group-based):

1. Switch to **Advanced Mode**
2. Add rule:
    - **Claim**: `groups`
    - **Operator**: `contains`
    - **Value**: `unraid-admins`

### Microsoft/Azure AD

#### Step 1: Azure AD Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
    - Name: **Unraid API**
    - Supported account types: Choose based on needs
    - Redirect URI: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`
5. After creation:
    - Note the **Application (client) ID**
    - Go to **Certificates & secrets** → Create new secret
    - Note the **Directory (tenant) ID**

#### Step 2: Configure in Unraid

**Basic Information:**

- **Provider ID**: `azure`
- **Display Name**: `Microsoft`
- **Client ID**: Your Application ID
- **Client Secret**: Your client secret
- **Issuer URL**: `https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0`

**Scopes:**

- `openid`
- `profile`
- `email`

**Authorization:**

- Use Simple Mode to add your company email domain
- Or use Advanced Mode for group-based access (requires Azure AD configuration)

### Keycloak

#### Step 1: Keycloak Setup

1. In Keycloak Admin Console, select your realm
2. Go to **Clients** → **Create**
3. Configure:
    - Client ID: `unraid-api`
    - Client Protocol: `openid-connect`
4. In client settings:
    - Access Type: `confidential`
    - Valid Redirect URIs: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`
5. Copy the secret from **Credentials** tab

#### Step 2: Configure in Unraid

**Basic Information:**

- **Provider ID**: `keycloak`
- **Display Name**: `Keycloak`
- **Client ID**: `unraid-api`
- **Client Secret**: Your client secret
- **Issuer URL**: `https://keycloak.example.com/realms/YOUR_REALM`

**Authorization (Advanced Mode for roles):**

- **Claim**: `realm_access.roles`
- **Operator**: `contains`
- **Value**: `unraid-admin`

### Authentik

#### Step 1: Authentik Setup

1. In Authentik, go to **Applications** → **Providers**
2. Create new OAuth2/OpenID Provider
3. Configure and copy client ID/secret
4. Create Application and link to provider

#### Step 2: Configure in Unraid

**Basic Information:**

- **Provider ID**: `authentik`
- **Display Name**: `Authentik`
- **Client ID**: Your client ID
- **Client Secret**: Your client secret
- **Issuer URL**: `https://authentik.example.com/application/o/unraid-api/`

### Okta

#### Step 1: Okta Setup

1. In Okta Admin, go to **Applications** → **Applications**
2. Click **Create App Integration**
3. Choose **OIDC - OpenID Connect** and **Web Application**
4. Configure with redirect URI
5. Assign users/groups

#### Step 2: Configure in Unraid

**Basic Information:**

- **Provider ID**: `okta`
- **Display Name**: `Okta`
- **Client ID**: Your client ID
- **Client Secret**: Your client secret
- **Issuer URL**: `https://YOUR_DOMAIN.okta.com`

## Authorization Rules

![Authorization Rules Configuration](./images/authorization-rules.png)
_Screenshot: Simple and Advanced authorization rule examples_

### Simple Mode Examples

#### Allow Company Domain

In Simple Authorization:

- **Allowed Email Domains**: Enter `company.com`
- This allows anyone with @company.com email

#### Allow Specific Users

- **Specific Email Addresses**: Add individual emails
- Click **Add Item** to add multiple addresses

### Advanced Mode Examples

#### Email Domain with Verification

Add two rules:

1. Rule 1:
    - **Claim**: `email`
    - **Operator**: `endsWith`
    - **Value**: `@company.com`
2. Rule 2:
    - **Claim**: `email_verified`
    - **Operator**: `equals`
    - **Value**: `true`

#### Group-Based Access

- **Claim**: `groups`
- **Operator**: `contains`
- **Value**: `admins`

#### Multiple Domains

- **Claim**: `email`
- **Operator**: `endsWith`
- **Values**: Add multiple domains

## Understanding the Interface

### Provider Tabs

- Each configured provider appears as a tab at the top
- Click a tab to switch between provider configurations
- The **+** button on the right adds a new provider

### Authorization Mode Dropdown

- **simple**: Best for email-based authorization (recommended for most users)
- **advanced**: For complex claim-based rules using JWT claims

### Simple Authorization Fields

When "simple" mode is selected, you'll see:

- **Allowed Email Domains**: Enter domains without @ (e.g., `company.com`)
    - Helper text: "Users with emails ending in these domains can login"
- **Specific Email Addresses**: Add individual email addresses
    - Helper text: "Only these exact email addresses can login"
- **Add Item** buttons to add multiple entries

### Additional Interface Elements

- **Enable Developer Sandbox**: Toggle to enable GraphQL sandbox at `/graphql`
- The interface uses a dark theme for better visibility
- Field validation indicators help ensure correct configuration

### Required Redirect URI

All providers must be configured with this redirect URI:

```
http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback
```

Replace `YOUR_UNRAID_IP` with your actual server IP address.

## Troubleshooting

### Common Issues

#### "Provider not found" error

- Ensure the Issuer URL is correct
- Check that the provider supports OIDC discovery (/.well-known/openid-configuration)

#### "Authorization failed"

- In Simple Mode: Check email domains are entered correctly (without @)
- In Advanced Mode: Verify claim names match exactly what your provider sends
- Enable debug logging to see actual claims

#### "Invalid redirect URI"

- Ensure the redirect URI in your provider matches exactly
- Include the port number (:3001)
- Use HTTP for local, HTTPS for production

#### Cannot see login button

- Check that at least one authorization rule is configured
- Verify the provider is enabled/saved

### Debug Mode

To troubleshoot issues:

1. Enable debug logging:

```bash
LOG_LEVEL=debug unraid-api start --debug
```

2. Check logs for:

- Received claims from provider
- Authorization rule evaluation
- Token validation errors

### Testing Your Configuration

![Login Page with SSO Buttons](./images/login-page-sso.png)
_Screenshot: Login page showing configured SSO buttons (Unraid.net and Google)_

1. Save your provider configuration
2. Log out (if logged in)
3. Navigate to the login page
4. Your configured provider button should appear
5. Click to test the login flow

## Security Best Practices

1. **Always use HTTPS in production** - OAuth requires secure connections
2. **Be specific with authorization** - Don't use overly broad rules
3. **Verify email addresses** - Add email_verified check in Advanced Mode
4. **Use groups over individual emails** - Easier to manage at scale
5. **Rotate secrets regularly** - Update client secrets periodically
6. **Test thoroughly** - Verify only intended users can access

## Need Help?

- Check provider's OIDC documentation
- Review Unraid API logs for detailed error messages
- Ensure your provider supports standard OIDC discovery
- Verify network connectivity between Unraid and provider
