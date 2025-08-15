---
title: OIDC Provider Setup
description: Configure OIDC (OpenID Connect) providers for SSO authentication in Unraid API
sidebar_position: 3
---

# OIDC Provider Setup

This guide walks you through configuring OIDC (OpenID Connect) providers for SSO authentication in the Unraid API using the web interface.

## Accessing OIDC Settings

1. Navigate to your Unraid server's web interface
2. The OIDC Providers section is available on the main configuration page
3. You'll see tabs for different providers - click the **+** button to add a new provider

### OIDC Providers Interface Overview

![Login Page with SSO Options](./images/sso-with-options.png)
_Screenshot: Login page showing traditional login form with SSO options - "Login With Unraid.net" and "Sign in with Google" buttons_

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

<details>
<summary><strong>Advanced Mode</strong></summary>

Advanced mode provides granular control using claim-based rules. You can:

- Create complex authorization rules based on JWT claims
- Use operators like equals, contains, endsWith, startsWith
- Combine multiple conditions with OR/AND logic
- Choose whether ANY rule must pass (OR mode) or ALL rules must pass (AND mode)

**When to use Advanced Mode:**

- You need to check group memberships
- You want to verify multiple claims (e.g., email domain AND verified status)
- You have complex authorization requirements
- You need fine-grained control over how rules are evaluated

</details>

## Authorization Rules

![Authorization Rules Configuration](./images/advanced-rules.png)
_Screenshot: Advanced authorization rules showing JWT claim configuration with email endsWith operator for domain-based access control_

### Simple Mode Examples

#### Allow Company Domain

In Simple Authorization:

- **Allowed Email Domains**: Enter `company.com`
- This allows anyone with @company.com email

#### Allow Specific Users

- **Specific Email Addresses**: Add individual emails
- Click **Add Item** to add multiple addresses

<details>
<summary><strong>Advanced Mode Examples</strong></summary>

#### Authorization Rule Mode

When using multiple rules, you can choose how they're evaluated:

- **OR Mode** (default): User is authorized if ANY rule passes
- **AND Mode**: User is authorized only if ALL rules pass

#### Email Domain with Verification (AND Mode)

To require both email domain AND verification:

1. Set **Authorization Rule Mode** to `AND`
2. Add two rules:
   - Rule 1:
     - **Claim**: `email`
     - **Operator**: `endsWith`
     - **Value**: `@company.com`
   - Rule 2:
     - **Claim**: `email_verified`
     - **Operator**: `equals`
     - **Value**: `true`

This ensures users must have both a company email AND a verified email address.

#### Group-Based Access (OR Mode)

To allow access to multiple groups:

1. Set **Authorization Rule Mode** to `OR` (default)
2. Add rules for each group:
   - **Claim**: `groups`
   - **Operator**: `contains`
   - **Value**: `admins`
   
   Or add another rule:
   - **Claim**: `groups`
   - **Operator**: `contains`
   - **Value**: `developers`

Users in either `admins` OR `developers` group will be authorized.

#### Multiple Domains

- **Claim**: `email`
- **Operator**: `endsWith`
- **Values**: Add multiple domains (e.g., `company.com`, `subsidiary.com`)

#### Complex Authorization (AND Mode)

For strict security requiring multiple conditions:

1. Set **Authorization Rule Mode** to `AND`
2. Add multiple rules that ALL must pass:
   - Email must be from company domain
   - Email must be verified
   - User must be in specific group
   - Account must have 2FA enabled (if claim available)

</details>

<details>
<summary><strong>Configuration Interface Details</strong></summary>

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

### Advanced Authorization Fields

When "advanced" mode is selected, you'll see:

- **Authorization Rule Mode**: Choose `OR` (any rule passes) or `AND` (all rules must pass)
- **Authorization Rules**: Add multiple claim-based rules
- **For each rule**:
    - **Claim**: The JWT claim to check
    - **Operator**: How to compare (equals, contains, endsWith, startsWith)
    - **Value**: What to match against

### Additional Interface Elements

- **Enable Developer Sandbox**: Toggle to enable GraphQL sandbox at `/graphql`
- The interface uses a dark theme for better visibility
- Field validation indicators help ensure correct configuration

</details>

### Required Redirect URI

All providers must be configured with this redirect URI:

```
http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback
```

Replace `YOUR_UNRAID_IP` with your actual server IP address.

### Issuer URL Format

The **Issuer URL** field accepts both formats, but **base URL is strongly recommended** for security:

- **Base URL** (recommended): `https://accounts.google.com`
- **Full discovery URL**: `https://accounts.google.com/.well-known/openid-configuration`

**⚠️ Security Note**: Always use the base URL format when possible. The system automatically appends `/.well-known/openid-configuration` for OIDC discovery. Using the full discovery URL directly disables important issuer validation checks and is not recommended by the OpenID Connect specification.

**Examples of correct base URLs:**
- Google: `https://accounts.google.com`
- Microsoft/Azure: `https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0`
- Keycloak: `https://keycloak.example.com/realms/YOUR_REALM`
- Authelia: `https://auth.yourdomain.com`

## Testing Your Configuration

![Login Page with SSO Buttons](./images/sso-with-options.png)
_Screenshot: Unraid login page displaying both traditional username/password authentication and SSO options with customized provider buttons_

1. Save your provider configuration
2. Log out (if logged in)
3. Navigate to the login page
4. Your configured provider button should appear
5. Click to test the login flow

## Troubleshooting

### Common Issues

#### "Provider not found" error

- Ensure the Issuer URL is correct
- Check that the provider supports OIDC discovery (/.well-known/openid-configuration)

#### "Authorization failed"

- In Simple Mode: Check email domains are entered correctly (without @)
- In Advanced Mode: 
  - Verify claim names match exactly what your provider sends
  - Check if Authorization Rule Mode is set correctly (OR vs AND)
  - Ensure all required claims are present in the token
- Enable debug logging to see actual claims and rule evaluation

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

## Security Best Practices

1. **Always use HTTPS in production** - OAuth requires secure connections
2. **Use Simple Mode for authorization** - Prevents overly accepting configurations and reduces misconfiguration risks
3. **Be specific with authorization** - Don't use overly broad rules
4. **Rotate secrets regularly** - Update client secrets periodically
5. **Test thoroughly** - Verify only intended users can access

## Need Help?

- Check provider's OIDC documentation
- Review Unraid API logs for detailed error messages
- Ensure your provider supports standard OIDC discovery
- Verify network connectivity between Unraid and provider

## Provider-Specific Setup

### Unraid.net Provider

The Unraid.net provider is built-in and pre-configured. You only need to configure authorization rules in the interface.

**Configuration:**
- **Issuer URL**: Pre-configured (built-in provider)
- **Client ID/Secret**: Pre-configured (built-in provider)
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

:::warning[Security Notice]
**Always use HTTPS for production redirect URIs!** The examples above use HTTP for initial setup and testing only. In production environments, you MUST use HTTPS (e.g., `https://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`) to ensure secure communication and prevent credential interception. Most OIDC providers will reject HTTP redirect URIs for security reasons.
:::

Configure authorization rules using Simple Mode (allowed email domains/addresses) or Advanced Mode for complex requirements.

### Google

Set up OAuth 2.0 credentials in [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application** as the application type
4. Add your redirect URI to **Authorized redirect URIs**
5. Configure the OAuth consent screen if prompted

**Configuration:**

- **Issuer URL**: `https://accounts.google.com`
- **Client ID/Secret**: From your OAuth 2.0 client credentials
- **Required Scopes**: `openid`, `profile`, `email`
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

:::warning[Google Domain Requirements]
**Google requires valid domain names for OAuth redirect URIs.** Local IP addresses and `.local` domains are not accepted. To use Google OAuth with your Unraid server, you'll need:

- **Option 1: Reverse Proxy** - Set up a reverse proxy (like NGINX Proxy Manager or Traefik) with a valid domain name pointing to your Unraid API
- **Option 2: Tailscale** - Use Tailscale to get a valid `*.ts.net` domain that Google will accept
- **Option 3: Dynamic DNS** - Use a DDNS service to get a public domain name for your server

Remember to update your redirect URI in both Google Cloud Console and your Unraid OIDC configuration to use the valid domain.
:::

For Google Workspace domains, use Advanced Mode with the `hd` claim to restrict access to your organization's domain.

### Authelia

Configure OIDC client in your Authelia `configuration.yml` with client ID `unraid-api` and generate a hashed secret using the Authelia hash-password command.

**Configuration:**

- **Issuer URL**: `https://auth.yourdomain.com`
- **Client ID**: `unraid-api` (or as configured in Authelia)
- **Client Secret**: Your unhashed secret
- **Required Scopes**: `openid`, `profile`, `email`, `groups`
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

Use Advanced Mode with `groups` claim for group-based authorization.

### Microsoft/Azure AD

Register a new app in [Azure Portal](https://portal.azure.com/) under Azure Active Directory → App registrations. Note the Application ID, create a client secret, and note your tenant ID.

**Configuration:**

- **Issuer URL**: `https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0`
- **Client ID**: Your Application (client) ID
- **Client Secret**: Generated client secret
- **Required Scopes**: `openid`, `profile`, `email`
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

Authorization rules can be configured in the interface using email domains or advanced claims.

### Keycloak

Create a new confidential client in Keycloak Admin Console with `openid-connect` protocol and copy the client secret from the Credentials tab.

**Configuration:**

- **Issuer URL**: `https://keycloak.example.com/realms/YOUR_REALM`
- **Client ID**: `unraid-api` (or as configured in Keycloak)
- **Client Secret**: From Keycloak Credentials tab
- **Required Scopes**: `openid`, `profile`, `email`
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

For role-based authorization, use Advanced Mode with `realm_access.roles` or `resource_access` claims.

### Authentik

Create a new OAuth2/OpenID Provider in Authentik, then create an Application and link it to the provider.

**Configuration:**

- **Issuer URL**: `https://authentik.example.com/application/o/unraid-api/`
- **Client ID**: From Authentik provider configuration
- **Client Secret**: From Authentik provider configuration
- **Required Scopes**: `openid`, `profile`, `email`
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

Authorization rules can be configured in the interface.

### Okta

Create a new OIDC Web Application in Okta Admin Console and assign appropriate users or groups.

**Configuration:**

- **Issuer URL**: `https://YOUR_DOMAIN.okta.com`
- **Client ID**: From Okta application configuration
- **Client Secret**: From Okta application configuration
- **Required Scopes**: `openid`, `profile`, `email`
- **Redirect URI**: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`

Authorization rules can be configured in the interface using email domains or advanced claims.
