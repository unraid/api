# connect-components via Nuxt 3

## Install dependencies

```bash
npm i
```

## Dev testing and builds with `.env` setup

There's 3 version required for various types of development, testing builds in the Unraid webgui, and creating a prod build for the Unraid webgui.

- `.env` for `npm run dev` local development
- `.env.staging` for `npm run build:dev` which tests builds in the Unraid webgui
- `.env.production` for `npm run build:webgui` which does a production build for the Unraid webgui

For the URL values, you can use what you'd like. So if you're testing locally, you can use `http://localhost:5555` for the account app if you have a local version running. Alternatively you're free to use the staging or production URLs.

For productions URLs you could ultimately not provide any value and the URL helpers will default to the production URLs. But for local dev and testing, it's usually easiest to keep the `.env` key value pairs so you don't forget about them.

### `.env` for `npm run dev` local development

```bash
VITE_ACCOUNT=http://localhost:5555
VITE_CONNECT=https://connect.myunraid.net
VITE_UNRAID_NET=https://preview.unraid.net
VITE_OS_RELEASES="https://releases.unraid.net/os"
VITE_CALLBACK_KEY="FIND_IN_1PASSWORD"
VITE_ALLOW_CONSOLE_LOGS=true
VITE_TAILWIND_BASE_FONT_SIZE=16
```

## `.env.staging` for `npm run build:dev` which tests builds in the Unraid webgui

Please take a look at the `prebuild:dev` & `postbuild:dev` scripts in `package.json` to see how the `.env.staging` file is used.

```bash
VITE_ACCOUNT=https://staging.account.unraid.net
VITE_CONNECT=https://connect.myunraid.net
VITE_UNRAID_NET=https://staging.unraid.net
VITE_OS_RELEASES="https://releases.unraid.net/os"
VITE_CALLBACK_KEY="FIND_IN_1PASSWORD"
VITE_ALLOW_CONSOLE_LOGS=TRUE
```

Notice how `VITE_TAILWIND_BASE_FONT_SIZE` is not set in the `.env.staging` file.
This is because the Unraid webgui uses the `font-size: 62.5%` "trick".

### `.env.production` for `npm run build:webgui` which does a production build for the Unraid webgui

Please take a look at the `prebuild:webgui` & `postbuild:webgui` scripts in `package.json` to see how the `.env.production` file is used.

```bash
VITE_ACCOUNT=https://account.unraid.net
VITE_CONNECT=https://connect.myunraid.net
VITE_UNRAID_NET=https://unraid.net
VITE_OS_RELEASES="https://releases.unraid.net/os"
VITE_CALLBACK_KEY="FIND_IN_1PASSWORD"
```

Both `VITE_ALLOW_CONSOLE_LOGS` and `VITE_TAILWIND_BASE_FONT_SIZE` should never be set here.

## Interfacing with `unraid-api`

@todo [Apollo VueJS Guide on Colocating Fragments](https://v4.apollo.vuejs.org/guide-composable/fragments.html#colocating-fragments)

## Internationalization

- The WebGUI now exposes the active locale as `window.LOCALE`; the app loads the matching bundle from `src/locales` at runtime and falls back to `en_US`.
- Run `pnpm --filter @unraid/web i18n:extract` to add any missing translation keys discovered in Vue components to `src/locales/en.json`. Other locale files receive English fallbacks for new keys so translators can keep them in sync.
