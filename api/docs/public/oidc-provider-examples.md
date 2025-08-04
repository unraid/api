# OIDC Provider Configuration Examples

This document provides examples of configuring OIDC providers with custom button styling.

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

## Important Notes

- Use inline CSS styles in the `buttonStyle` field since Tailwind classes won't be available at runtime
- The default `.sso-button` class styles can be overridden with inline styles
- Test button styling in both light and dark modes
- Use `!important` sparingly, only when needed to override the default styles
- Consider accessibility when customizing colors (maintain sufficient contrast)
