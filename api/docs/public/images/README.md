# Screenshot Images for OIDC Documentation

This directory should contain the following screenshots for the OIDC provider documentation:

## Required Screenshots

1. **oidc-main-interface.png**
   - Shows the main OIDC configuration interface
   - Should display Unraid.net and Google tabs
   - Simple authorization mode selected
   - Shows the email domains and specific addresses fields

2. **unraid-net-provider.png**
   - Unraid.net provider tab selected
   - Shows the warning message about built-in provider
   - Simple authorization fields visible

3. **google-provider-config.png**
   - Google provider configuration form
   - All required fields shown (Client ID, Secret, Issuer URL, etc.)

4. **add-new-provider.png**
   - The interface when clicking the + button
   - Empty form for adding a new OIDC provider

5. **authelia-provider.png**
   - Authelia provider configuration
   - Shows group-based authorization example

6. **authorization-rules.png**
   - Examples of both simple and advanced authorization rules
   - Shows the dropdown for switching between simple/advanced modes
   - In advanced mode, shows the Authorization Rule Mode dropdown (OR/AND)
   - Displays multiple rules with different operators (equals, contains, endsWith, startsWith)

7. **login-page-sso.png**
   - Login page with SSO buttons
   - Shows "Login with Unraid.net" and "Log in with Google" buttons

## How to Capture Screenshots

1. Navigate to the OIDC configuration page at http://localhost:3000
2. Use browser developer tools or a screenshot tool to capture each interface state
3. Save images as PNG files with the names listed above
4. Place them in this directory (/api/docs/public/images/)

## Key Features to Capture

### Authorization Rules Interface
When capturing authorization-rules.png, make sure to show:
- **Authorization Mode dropdown**: Simple vs Advanced toggle
- **Authorization Rule Mode**: The OR/AND dropdown in advanced mode
- **Multiple rules**: At least 2-3 example rules showing different operators
- **Rule operators**: Demonstrate equals, contains, endsWith, startsWith
- **Add Item buttons**: Show how to add multiple rules

### Rule Evaluation Modes
Ensure the screenshot shows the difference between:
- **OR Mode**: "User authorized if ANY rule passes" 
- **AND Mode**: "User authorized if ALL rules pass"

## Image Guidelines

- Use PNG format for clarity
- Capture full interface sections, not just fragments
- Include any helpful annotations if needed
- Ensure text is readable (high resolution)
- Dark theme interface should be clearly visible
- Show actual form fields and dropdowns when possible