# i18n Setup Guide

## Overview

This project uses:
- **Frontend**: `vue-i18n` for Vue.js components
- **Backend**: `nestjs-i18n` for NestJS API
- **Translation Management**: Crowdin for collaborative translation

## Project Structure

```
/web/src/locales/       # Frontend translations
  en_US.json           # Base English translations
  *.json              # Other locale translations

/api/src/i18n/         # Backend translations
  en/                  # English translations
    common.json        # Common messages
    errors.json        # Error messages
    validation.json    # Validation messages
  */                   # Other locales
```

## Environment Setup

Set these environment variables for Crowdin:
```bash
export CROWDIN_PROJECT_ID=your_project_id
export CROWDIN_API_TOKEN=your_api_token
```

## Usage

### Frontend (Vue)

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Use translation
const message = t('welcome')
</script>

<template>
  <div>{{ t('hello') }}</div>
</template>
```

### Backend (NestJS)

```typescript
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class MyService {
  constructor(private readonly i18n: I18nService) {}

  async getMessage() {
    return this.i18n.translate('common.welcome');
  }
}
```

## Commands

### Extract Translation Keys
```bash
# Extract missing keys from Vue components
pnpm i18n:extract

# Check for missing translations
pnpm --filter ./web i18n:missing
```

### Crowdin Sync
```bash
# Upload source files to Crowdin
pnpm crowdin:upload

# Download translations from Crowdin
pnpm crowdin:download

# Full sync (extract, upload, download)
pnpm crowdin:sync
```

## Build-time Integration

Translations are bundled at build time:
- Frontend: Included in the Vite build process
- Backend: Copied with the NestJS build

## Adding New Translations

1. Add key to source files (`en_US.json` or `en/*.json`)
2. Run `pnpm crowdin:upload` to sync with Crowdin
3. Translators work on Crowdin
4. Run `pnpm crowdin:download` to fetch translations
5. Build and deploy

## Locale Detection

- **Frontend**: Uses browser's Accept-Language header
- **Backend**: Detects from (in order):
  1. Query parameter: `?lang=fr`
  2. Header: `x-locale` or `x-lang`
  3. Accept-Language header