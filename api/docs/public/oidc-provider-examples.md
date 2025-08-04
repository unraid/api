# OIDC Provider Configuration Examples

This document provides examples of configuring OIDC providers with custom button styling.

## Prerequisites

### Redirect URI Configuration

When configuring your OIDC provider, you'll need to set the redirect URI to:

```text
http://YOUR_UNRAID_IP:PORT/graphql/api/auth/oidc/callback
```

For example:

- Local development: `http://localhost:3001/graphql/api/auth/oidc/callback`
- Production: `http://192.168.1.100:3001/graphql/api/auth/oidc/callback`
- With custom domain: `https://unraid.example.com/graphql/api/auth/oidc/callback`

## Button Styling Options

### Button Variants

The `buttonVariant` field accepts any valid button variant from Reka UI.

View all available button variants and their appearance in the [Reka UI Button documentation](https://reka-ui.com/docs/components/button).

### Custom CSS Styles

You can use inline CSS styles to customize the button appearance. The `.sso-button` class is applied by default with:

```css
.sso-button {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  text-transform: uppercase !important;
  letter-spacing: 2px !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 0.125rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

To override these defaults, use the `buttonStyle` field with inline CSS.

## Provider Examples

### Google

#### Setting up Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the OAuth consent screen if needed
6. For "Application type", select **Web application**
7. Fill in the following:
   - **Name**: e.g., "Unraid SSO"
   - **Authorized JavaScript origins**:
     - Add your Unraid server URL (e.g., `http://192.168.1.100:3001`)
   - **Authorized redirect URIs**:
     - Add: `http://YOUR_UNRAID_IP:3001/graphql/api/auth/oidc/callback`
     - For local testing: `http://localhost:3001/graphql/api/auth/oidc/callback`
8. Click "Create" and save your Client ID and Client Secret

#### Finding Your Google Sub ID

1. Use Google's OAuth 2.0 Playground: <https://developers.google.com/oauthplayground/>
2. Select "Google OAuth2 API v2" > `https://www.googleapis.com/auth/userinfo.profile`
3. Authorize and exchange for tokens
4. Click "Step 3: Configure request to API"
5. The response will contain your `sub` (subject ID)

Alternatively, after first login attempt, check the Unraid API logs for your sub ID.

#### Configuration Examples

**Basic configuration with subject ID authorization:**
```json
{
  "id": "google",
  "name": "Google",
  "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "clientSecret": "YOUR_SECRET",
  "issuer": "https://accounts.google.com",
  "scopes": ["openid", "profile", "email"],
  "authorizedSubIds": ["YOUR_GOOGLE_SUB_ID"],
  "buttonText": "Sign in with Google",
  "buttonIcon": "https://www.google.com/favicon.ico",
  "buttonVariant": "outline",
  "buttonStyle": "background-color: #ffffff; color: #3c4043; border: 1px solid #dadce0;"
}
```

**With email domain authorization:**
```json
{
  "id": "google",
  "name": "Google",
  "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "clientSecret": "YOUR_SECRET",
  "issuer": "https://accounts.google.com",
  "scopes": ["openid", "profile", "email"],
  "authorizationRules": [{
    "claim": "email",
    "operator": "endsWith",
    "value": ["@company.com", "@partner.com"]
  }],
  "buttonText": "Sign in with Google",
  "buttonIcon": "https://www.google.com/favicon.ico",
  "buttonVariant": "outline",
  "buttonStyle": "background-color: #ffffff; color: #3c4043; border: 1px solid #dadce0;"
}
```

**For Google Workspace domains (using 'hd' claim):**
```json
{
  "id": "google",
  "name": "Google Workspace",
  "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "clientSecret": "YOUR_SECRET",
  "issuer": "https://accounts.google.com",
  "scopes": ["openid", "profile", "email"],
  "authorizationRules": [{
    "claim": "hd",
    "operator": "equals",
    "value": ["company.com"]
  }],
  "buttonText": "Sign in with Company Google",
  "buttonIcon": "https://www.google.com/favicon.ico",
  "buttonVariant": "outline",
  "buttonStyle": "background-color: #ffffff; color: #3c4043; border: 1px solid #dadce0;"
}
```

**Alternative configuration with explicit endpoints (if discovery fails):**

```json
{
  "id": "google",
  "name": "Google",
  "clientId": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "clientSecret": "YOUR_SECRET",
  "issuer": "https://accounts.google.com",
  "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenEndpoint": "https://oauth2.googleapis.com/token",
  "scopes": ["openid", "profile", "email"],
  "authorizedSubIds": ["YOUR_GOOGLE_SUB_ID"],
  "buttonText": "Sign in with Google",
  "buttonIcon": "https://www.google.com/favicon.ico",
  "buttonVariant": "outline",
  "buttonStyle": "background-color: #ffffff; color: #3c4043; border: 1px solid #dadce0;"
}
```

**Important Google OIDC Details:**
- **Issuer URL**: Always use `https://accounts.google.com` for Google
- **Discovery URL**: Google's OIDC configuration is automatically discovered at `https://accounts.google.com/.well-known/openid-configuration`
- You don't need to specify authorization or token endpoints - they're automatically discovered from the issuer URL

**Note**: It may take 5 minutes to a few hours for Google OAuth settings to take effect.

### GitHub

```json
{
  "id": "github",
  "name": "GitHub",
  "clientId": "YOUR_GITHUB_CLIENT_ID",
  "clientSecret": "YOUR_GITHUB_SECRET",
  "issuer": "https://github.com",
  "authorizationEndpoint": "https://github.com/login/oauth/authorize",
  "tokenEndpoint": "https://github.com/login/oauth/access_token",
  "scopes": ["user:email"],
  "authorizedSubIds": ["YOUR_GITHUB_ID"],
  "buttonText": "Sign in with GitHub",
  "buttonIcon": "https://github.com/favicon.ico",
  "buttonVariant": "outline",
  "buttonStyle": "background-color: #24292e; color: white; border: none;"
}
```

### Microsoft/Azure AD

```json
{
  "id": "microsoft",
  "name": "Microsoft",
  "clientId": "YOUR_AZURE_CLIENT_ID",
  "clientSecret": "YOUR_AZURE_SECRET",
  "issuer": "https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0",
  "scopes": ["openid", "profile", "email"],
  "authorizedSubIds": ["YOUR_MICROSOFT_SUB_ID"],
  "buttonText": "Sign in with Microsoft",
  "buttonIcon": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmNDRmMjUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmNDRmMjUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2EpIiBkPSJNMSAxaDE5djloLTE5eiIvPjxwYXRoIGZpbGw9IiMzMWM0ZjMiIGQ9Ik0xIDEwaDEwdjEwaC0xMHoiLz48cGF0aCBmaWxsPSIjZmZiOTAwIiBkPSJNMTEgMTBoMTB2MTBoLTEweiIvPjxwYXRoIGZpbGw9IiMwMGE0ZWYiIGQ9Ik0xMSAxaDEwdjloLTEweiIvPjwvc3ZnPg==",
  "buttonVariant": "outline",
  "buttonStyle": "background-color: #ffffff; color: #5e5e5e; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
}
```

### Custom Enterprise SSO

```json
{
  "id": "enterprise",
  "name": "Company SSO",
  "clientId": "enterprise-client-id",
  "issuer": "https://sso.company.com",
  "scopes": ["openid", "profile", "email"],
  "authorizedSubIds": ["*"],
  "buttonText": "Company Login",
  "buttonVariant": "primary",
  "buttonStyle": "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);"
}
```

## Custom CSS Style Examples

### Professional/Enterprise Look

```css
buttonStyle: "background-color: #f8f9fa; color: #212529; border: 1px solid #dee2e6; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;"
```

### Modern Gradient

```css
buttonStyle: "background: linear-gradient(to right, #4f46e5, #7c3aed); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);"
```

### Minimal Style

```css
buttonStyle: "text-transform: none; letter-spacing: normal; font-weight: 400; padding: 12px 24px;"
```

### Pill-Shaped Button

```css
buttonStyle: "border-radius: 9999px; padding: 12px 32px;"
```

### Large Button

```css
buttonStyle: "font-size: 1.125rem; padding: 16px 32px; font-weight: 500;"
```

### Glass Morphism Effect

```css
buttonStyle: "background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); color: white;"
```

### Neumorphic Style

```css
buttonStyle: "background-color: #e0e5ec; box-shadow: 9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff; border: none; border-radius: 12px;"
```

## Security Considerations

### One-Time Token Validation

The Unraid API implements one-time token validation for enhanced security:
- Each OIDC session token can only be validated once
- After successful validation, the token is immediately invalidated
- This prevents token replay attacks and unauthorized reuse
- Tokens have a 5-minute TTL (Time To Live)

### Authorization

The Unraid API supports two methods for authorizing OIDC users:

#### Subject ID Authorization (Legacy)

The `authorizedSubIds` field restricts which users can authenticate:

- Use specific sub IDs for better security (e.g., `["1234567890"]`)
- Leave empty `[]` to deny all users

To find a user's subject ID:
1. Enable debug mode and attempt to log in
2. Check the API logs for the subject ID
3. Add it to the authorized list

#### Claim-Based Authorization Rules (Recommended)

More flexible authorization using JWT claims. You can create rules based on any claim in the ID token.

**Authorization Rule Structure:**
- `claim`: The JWT claim to check (e.g., 'email', 'sub', 'groups', 'hd')
- `operator`: How to compare the claim value
  - `equals`: Exact match
  - `contains`: Substring match
  - `endsWith`: Suffix match (useful for email domains)
  - `startsWith`: Prefix match
  - `regex`: Regular expression match
  - `in`: Claim value must be in the provided list
- `value`: Array of values to match against (any match passes)

**Examples:**

Allow users from a specific email domain:
```json
{
  "authorizationRules": [{
    "claim": "email",
    "operator": "endsWith",
    "value": ["@company.com", "@subsidiary.com"]
  }]
}
```

Allow specific Google Workspace domain (using Google's 'hd' claim):
```json
{
  "authorizationRules": [{
    "claim": "hd",
    "operator": "equals",
    "value": ["company.com"]
  }]
}
```

Allow users in specific groups:
```json
{
  "authorizationRules": [{
    "claim": "groups",
    "operator": "contains",
    "value": ["admins", "developers"]
  }]
}
```

Complex rule with multiple conditions (all must pass):
```json
{
  "authorizationRules": [
    {
      "claim": "email",
      "operator": "endsWith",
      "value": ["@company.com"]
    },
    {
      "claim": "email_verified",
      "operator": "equals",
      "value": ["true"]
    }
  ]
}
```

**Note:** If both `authorizedSubIds` and `authorizationRules` are empty, no users will be authorized.

## Important Notes

- Use inline CSS styles in the `buttonStyle` field since Tailwind classes won't be available at runtime
- The default `.sso-button` class styles can be overridden with inline styles
- Test button styling in both light and dark modes
- Use `!important` sparingly, only when needed to override the default styles
- Consider accessibility when customizing colors (maintain sufficient contrast)
- Always use HTTPS in production for OAuth redirect URIs
- Keep your client secrets secure and never commit them to version control
