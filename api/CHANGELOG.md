# Changelog

## [4.29.2](https://github.com/unraid/api/compare/v4.29.1...v4.29.2) (2025-12-19)


### Bug Fixes

* unraid-connect plugin not loaded when connect is installed ([#1856](https://github.com/unraid/api/issues/1856)) ([73135b8](https://github.com/unraid/api/commit/73135b832801f5c76d60020161492e4770958c3d))

## [4.29.1](https://github.com/unraid/api/compare/v4.29.0...v4.29.1) (2025-12-19)


### Bug Fixes

* revert replace docker overview table with web component (7.3+) ([#1853](https://github.com/unraid/api/issues/1853)) ([560db88](https://github.com/unraid/api/commit/560db880cc138324f9ff8753f7209b683a84c045))

## [4.29.0](https://github.com/unraid/api/compare/v4.28.2...v4.29.0) (2025-12-19)


### Features

* replace docker overview table with web component (7.3+) ([#1764](https://github.com/unraid/api/issues/1764)) ([277ac42](https://github.com/unraid/api/commit/277ac420464379e7ee6739c4530271caf7717503))


### Bug Fixes

* handle race condition between guid loading and license check ([#1847](https://github.com/unraid/api/issues/1847)) ([8b155d1](https://github.com/unraid/api/commit/8b155d1f1c99bb19efbc9614e000d852e9f0c12d))
* resolve issue with "Continue" button when updating ([#1852](https://github.com/unraid/api/issues/1852)) ([d099e75](https://github.com/unraid/api/commit/d099e7521d2062bb9cf84f340e46b169dd2492c5))
* update myservers config references to connect config references ([#1810](https://github.com/unraid/api/issues/1810)) ([e1e3ea7](https://github.com/unraid/api/commit/e1e3ea7eb68cc6840f67a8aec937fd3740e75b28))

## [4.28.2](https://github.com/unraid/api/compare/v4.28.1...v4.28.2) (2025-12-16)


### Bug Fixes

* **api:** timeout on startup on 7.0 and 6.12 ([#1844](https://github.com/unraid/api/issues/1844)) ([e243ae8](https://github.com/unraid/api/commit/e243ae836ec1a7fde37dceeb106cc693b20ec82b))

## [4.28.1](https://github.com/unraid/api/compare/v4.28.0...v4.28.1) (2025-12-16)


### Bug Fixes

* empty commit to release as 4.28.1 ([df78608](https://github.com/unraid/api/commit/df786084572eefb82e086c15939b50cc08b9db10))

## [4.28.0](https://github.com/unraid/api/compare/v4.27.2...v4.28.0) (2025-12-15)


### Features

* when cancelling OS upgrade, delete any plugin files that were d… ([#1823](https://github.com/unraid/api/issues/1823)) ([74df938](https://github.com/unraid/api/commit/74df938e450def2ee3e2864d4b928f53a68e9eb8))


### Bug Fixes

* change keyfile watcher to poll instead of inotify on FAT32 ([#1820](https://github.com/unraid/api/issues/1820)) ([23a7120](https://github.com/unraid/api/commit/23a71207ddde221867562b722f4e65a5fc4dd744))
* enhance dark mode support in theme handling ([#1808](https://github.com/unraid/api/issues/1808)) ([d6e2939](https://github.com/unraid/api/commit/d6e29395c8a8b0215d4f5945775de7fa358d06ec))
* improve API startup reliability with timeout budget tracking ([#1824](https://github.com/unraid/api/issues/1824)) ([51f025b](https://github.com/unraid/api/commit/51f025b105487b178048afaabf46b260c4a7f9c1))
* PHP Warnings in Management Settings ([#1805](https://github.com/unraid/api/issues/1805)) ([832e9d0](https://github.com/unraid/api/commit/832e9d04f207d3ec612c98500a2ffc86659264e5))
* **plg:** explicitly stop an existing api before installation ([#1841](https://github.com/unraid/api/issues/1841)) ([99ce88b](https://github.com/unraid/api/commit/99ce88bfdc0a7f020c42f2fe0c6a0f4e32ac8f5a))
* update @unraid/shared-callbacks to version 3.0.0 ([#1831](https://github.com/unraid/api/issues/1831)) ([73b2ce3](https://github.com/unraid/api/commit/73b2ce360c66cd9bedc138a5f8306af04b6bde77))
* **ups:** convert estimatedRuntime from minutes to seconds ([#1822](https://github.com/unraid/api/issues/1822)) ([024ae69](https://github.com/unraid/api/commit/024ae69343bad5a3cbc19f80e357082e9b2efc1e))

## [4.27.2](https://github.com/unraid/api/compare/v4.27.1...v4.27.2) (2025-11-21)


### Bug Fixes

* issue with header flashing + issue with trial date ([64875ed](https://github.com/unraid/api/commit/64875edbba786a0d1ba0113c9e9a3d38594eafcc))

## [4.27.1](https://github.com/unraid/api/compare/v4.27.0...v4.27.1) (2025-11-21)


### Bug Fixes

* missing translations for expiring trials ([#1800](https://github.com/unraid/api/issues/1800)) ([36c1049](https://github.com/unraid/api/commit/36c104915ece203a3cac9e1a13e0c325e536a839))
* resolve header flash when background color is set ([#1796](https://github.com/unraid/api/issues/1796)) ([dc9a036](https://github.com/unraid/api/commit/dc9a036c73d8ba110029364e0d044dc24c7d0dfa))

## [4.27.0](https://github.com/unraid/api/compare/v4.26.2...v4.27.0) (2025-11-19)


### Features

* remove Unraid API log download functionality ([#1793](https://github.com/unraid/api/issues/1793)) ([e4a9b82](https://github.com/unraid/api/commit/e4a9b8291b049752a9ff59b17ff50cf464fe0535))


### Bug Fixes

* auto-uninstallation of connect api plugin ([#1791](https://github.com/unraid/api/issues/1791)) ([e734043](https://github.com/unraid/api/commit/e7340431a58821ec1b4f5d1b452fba6613b01fa5))

## [4.26.2](https://github.com/unraid/api/compare/v4.26.1...v4.26.2) (2025-11-19)


### Bug Fixes

* **theme:** Missing header background color ([e2fdf6c](https://github.com/unraid/api/commit/e2fdf6cadbd816559b8c82546c2bc771a81ffa9e))

## [4.26.1](https://github.com/unraid/api/compare/v4.26.0...v4.26.1) (2025-11-18)


### Bug Fixes

* **theme:** update theme class naming and scoping logic ([b28ef1e](https://github.com/unraid/api/commit/b28ef1ea334cb4842f01fa992effa7024185c6c9))

## [4.26.0](https://github.com/unraid/api/compare/v4.25.3...v4.26.0) (2025-11-17)


### Features

* add cpu power query & subscription ([#1745](https://github.com/unraid/api/issues/1745)) ([d7aca81](https://github.com/unraid/api/commit/d7aca81c60281bfa47fb9113929c1ead6ed3361b))
* add schema publishing to apollo studio ([#1772](https://github.com/unraid/api/issues/1772)) ([7e13202](https://github.com/unraid/api/commit/7e13202aa1c02803095bb72bb1bcb2472716f53a))
* add workflow_dispatch trigger to schema publishing workflow ([818e7ce](https://github.com/unraid/api/commit/818e7ce997059663e07efcf1dab706bf0d7fc9da))
* apollo studio readme link ([c4cd0c6](https://github.com/unraid/api/commit/c4cd0c63520deec15d735255f38811f0360fe3a1))
* **cli:** make `unraid-api plugins remove` scriptable ([#1774](https://github.com/unraid/api/issues/1774)) ([64eb9ce](https://github.com/unraid/api/commit/64eb9ce9b5d1ff4fb1f08d9963522c5d32221ba7))
* use persisted theme css to fix flashes on header ([#1784](https://github.com/unraid/api/issues/1784)) ([854b403](https://github.com/unraid/api/commit/854b403fbd85220a3012af58ce033cf0b8418516))


### Bug Fixes

* **api:** decode html entities before parsing notifications ([#1768](https://github.com/unraid/api/issues/1768)) ([42406e7](https://github.com/unraid/api/commit/42406e795da1e5b95622951a467722dde72d51a8))
* **connect:** disable api plugin if unraid plugin is absent ([#1773](https://github.com/unraid/api/issues/1773)) ([c264a18](https://github.com/unraid/api/commit/c264a1843cf115e8cc1add1ab4f12fdcc932405a))
* detection of flash backup activation state ([#1769](https://github.com/unraid/api/issues/1769)) ([d18eaf2](https://github.com/unraid/api/commit/d18eaf2364e0c04992c52af38679ff0a0c570440))
* re-add missing header gradient styles ([#1787](https://github.com/unraid/api/issues/1787)) ([f8a6785](https://github.com/unraid/api/commit/f8a6785e9c92f81acaef76ac5eb78a4a769e69da))
* respect OS safe mode in plugin loader ([#1775](https://github.com/unraid/api/issues/1775)) ([92af3b6](https://github.com/unraid/api/commit/92af3b61156cabae70368cf5222a2f7ac5b4d083))

## [4.25.3](https://github.com/unraid/unraid-api/compare/v4.25.2...v4.25.3) (2025-10-22)


### Bug Fixes

* flaky watch on boot drive's dynamix config ([ec7aa06](https://github.com/unraid/unraid-api/commit/ec7aa06d4a5fb1f0e84420266b0b0d7ee09a3663))

## [4.25.2](https://github.com/unraid/api/compare/v4.25.1...v4.25.2) (2025-09-30)


### Bug Fixes

* enhance activation code modal visibility logic ([#1733](https://github.com/unraid/api/issues/1733)) ([e57ec00](https://github.com/unraid/api/commit/e57ec00627e54ce76d903fd0fa8686ad02b393f3))

## [4.25.1](https://github.com/unraid/api/compare/v4.25.0...v4.25.1) (2025-09-30)


### Bug Fixes

* add cache busting to web component extractor ([#1731](https://github.com/unraid/api/issues/1731)) ([0d165a6](https://github.com/unraid/api/commit/0d165a608740505bdc505dcf69fb615225969741))
* Connect won't appear within Apps - Previous Apps ([#1727](https://github.com/unraid/api/issues/1727)) ([d73953f](https://github.com/unraid/api/commit/d73953f8ff3d7425c0aed32d16236ededfd948e1))

## [4.25.0](https://github.com/unraid/api/compare/v4.24.1...v4.25.0) (2025-09-26)


### Features

* add Tailwind scoping plugin and integrate into Vite config ([#1722](https://github.com/unraid/api/issues/1722)) ([b7afaf4](https://github.com/unraid/api/commit/b7afaf463243b073e1ab1083961a16a12ac6c4a3))
* notification filter controls pill buttons ([#1718](https://github.com/unraid/api/issues/1718)) ([661865f](https://github.com/unraid/api/commit/661865f97611cf802f239fde8232f3109281dde6))


### Bug Fixes

* enable auth guard for nested fields - thanks [@ingel81](https://github.com/ingel81) ([7bdeca8](https://github.com/unraid/api/commit/7bdeca8338a3901f15fde06fd7aede3b0c16e087))
* enhance user context validation in auth module ([#1726](https://github.com/unraid/api/issues/1726)) ([cd5eff1](https://github.com/unraid/api/commit/cd5eff11bcb4398581472966cb7ec124eac7ad0a))

## [4.24.1](https://github.com/unraid/api/compare/v4.24.0...v4.24.1) (2025-09-23)


### Bug Fixes

* cleanup leftover removed packages on upgrade ([#1719](https://github.com/unraid/api/issues/1719)) ([9972a5f](https://github.com/unraid/api/commit/9972a5f178f9a251e6c129d85c5f11cfd25e6281))
* enhance version comparison logic in installation script ([d9c561b](https://github.com/unraid/api/commit/d9c561bfebed0c553fe4bfa26b088ae71ca59755))
* issue with incorrect permissions on viewer / other roles ([378cdb7](https://github.com/unraid/api/commit/378cdb7f102f63128dd236c13f1a3745902d5a2c))

## [4.24.0](https://github.com/unraid/api/compare/v4.23.1...v4.24.0) (2025-09-18)


### Features

* improve dom content loading by being more efficient about component mounting ([#1716](https://github.com/unraid/api/issues/1716)) ([d8b166e](https://github.com/unraid/api/commit/d8b166e4b6a718e07783d9c8ac8393b50ec89ae3))

## [4.23.1](https://github.com/unraid/api/compare/v4.23.0...v4.23.1) (2025-09-17)


### Bug Fixes

* cleanup ini parser logic with better fallbacks ([#1713](https://github.com/unraid/api/issues/1713)) ([1691362](https://github.com/unraid/api/commit/16913627de9497a5d2f71edb710cec6e2eb9f890))

## [4.23.0](https://github.com/unraid/api/compare/v4.22.2...v4.23.0) (2025-09-16)


### Features

* add unraid api status manager ([#1708](https://github.com/unraid/api/issues/1708)) ([1d9ce0a](https://github.com/unraid/api/commit/1d9ce0aa3d067726c2c880929408c68f53e13e0d))


### Bug Fixes

* **logging:** remove colorized logs ([#1705](https://github.com/unraid/api/issues/1705)) ([1d2c670](https://github.com/unraid/api/commit/1d2c6701ce56b1d40afdb776065295e9273d08e9))
* no sizeRootFs unless queried ([#1710](https://github.com/unraid/api/issues/1710)) ([9714b21](https://github.com/unraid/api/commit/9714b21c5c07160b92a11512e8b703908adb0620))
* use virtual-modal-container ([#1709](https://github.com/unraid/api/issues/1709)) ([44b4d77](https://github.com/unraid/api/commit/44b4d77d803aa724968307cfa463f7c440791a10))

## [4.22.2](https://github.com/unraid/api/compare/v4.22.1...v4.22.2) (2025-09-15)


### Bug Fixes

* **deps:** pin dependency conventional-changelog-conventionalcommits to 9.1.0 ([#1697](https://github.com/unraid/api/issues/1697)) ([9a86c61](https://github.com/unraid/api/commit/9a86c615da2e975f568922fa012cc29b3f9cde0e))
* **deps:** update dependency filenamify to v7 ([#1703](https://github.com/unraid/api/issues/1703)) ([b80988a](https://github.com/unraid/api/commit/b80988aaabebc4b8dbf2bf31f0764bf2f28e1575))
* **deps:** update graphqlcodegenerator monorepo (major) ([#1689](https://github.com/unraid/api/issues/1689)) ([ba4a43a](https://github.com/unraid/api/commit/ba4a43aec863fc30c47dd17370d74daed7f84703))
* false positive on verify_install script being external shell ([#1704](https://github.com/unraid/api/issues/1704)) ([31a255c](https://github.com/unraid/api/commit/31a255c9281b29df983d0f5d0475cd5a69790a48))
* improve vue mount speed by 10x ([c855caa](https://github.com/unraid/api/commit/c855caa9b2d4d63bead1a992f5c583e00b9ba843))

## [4.22.1](https://github.com/unraid/api/compare/v4.22.0...v4.22.1) (2025-09-12)


### Bug Fixes

* set input color in SSO field rather than inside of the main.css ([01d353f](https://github.com/unraid/api/commit/01d353fa08a3df688b37a495a204605138f7f71d))

## [4.22.0](https://github.com/unraid/api/compare/v4.21.0...v4.22.0) (2025-09-12)


### Features

* improved update ui ([#1691](https://github.com/unraid/api/issues/1691)) ([a59b363](https://github.com/unraid/api/commit/a59b363ebc1e660f854c55d50fc02c823c2fd0cc))


### Bug Fixes

* **deps:** update dependency camelcase-keys to v10 ([#1687](https://github.com/unraid/api/issues/1687)) ([95faeaa](https://github.com/unraid/api/commit/95faeaa2f39bf7bd16502698d7530aaa590b286d))
* **deps:** update dependency p-retry to v7 ([#1608](https://github.com/unraid/api/issues/1608)) ([c782cf0](https://github.com/unraid/api/commit/c782cf0e8710c6690050376feefda3edb30dd549))
* **deps:** update dependency uuid to v13 ([#1688](https://github.com/unraid/api/issues/1688)) ([2fef10c](https://github.com/unraid/api/commit/2fef10c94aae910e95d9f5bcacf7289e2cca6ed9))
* **deps:** update dependency vue-sonner to v2 ([#1475](https://github.com/unraid/api/issues/1475)) ([f95ca9c](https://github.com/unraid/api/commit/f95ca9c9cb69725dcf3bb4bcbd0b558a2074e311))
* display settings fix for languages on less than 7.2-beta.2.3 ([#1696](https://github.com/unraid/api/issues/1696)) ([03dae7c](https://github.com/unraid/api/commit/03dae7ce66b3409593eeee90cd5b56e2a920ca44))
* hide reset help option when sso is being checked ([#1695](https://github.com/unraid/api/issues/1695)) ([222ced7](https://github.com/unraid/api/commit/222ced7518d40c207198a3b8548f0e024bc865b0))
* progressFrame white on black ([0990b89](https://github.com/unraid/api/commit/0990b898bd02c231153157c20d5142e5fd4513cd))

## [4.21.0](https://github.com/unraid/api/compare/v4.20.4...v4.21.0) (2025-09-10)


### Features

* add zsh shell detection to install script ([#1539](https://github.com/unraid/api/issues/1539)) ([50ea2a3](https://github.com/unraid/api/commit/50ea2a3ffb82b30152fb85e0fb9b0d178d596efe))
* **api:** determine if docker container has update ([#1582](https://github.com/unraid/api/issues/1582)) ([e57d81e](https://github.com/unraid/api/commit/e57d81e0735772758bb85e0b3c89dce15c56635e))


### Bug Fixes

* white on white login text ([ae4d3ec](https://github.com/unraid/api/commit/ae4d3ecbc417454ae3c6e02018f8e4c49bbfc902))

## [4.20.4](https://github.com/unraid/api/compare/v4.20.3...v4.20.4) (2025-09-09)


### Bug Fixes

* staging PR plugin fixes + UI issues on 7.2 beta ([b79b44e](https://github.com/unraid/api/commit/b79b44e95c65a124313814ab55b0d0a745a799c7))

## [4.20.3](https://github.com/unraid/api/compare/v4.20.2...v4.20.3) (2025-09-09)


### Bug Fixes

* header background color issues fixed on 7.2 - thanks Nick! ([73c1100](https://github.com/unraid/api/commit/73c1100d0ba396fe4342f8ce7561017ab821e68b))

## [4.20.2](https://github.com/unraid/api/compare/v4.20.1...v4.20.2) (2025-09-09)


### Bug Fixes

* trigger deployment ([a27453f](https://github.com/unraid/api/commit/a27453fda81e4eeb07f257e60516bebbbc27cf7a))

## [4.20.1](https://github.com/unraid/api/compare/v4.20.0...v4.20.1) (2025-09-09)


### Bug Fixes

* adjust header styles to fix flashing and width issues - thanks ZarZ ([4759b3d](https://github.com/unraid/api/commit/4759b3d0b3fb6bc71636f75f807cd6f4f62305d1))

## [4.20.0](https://github.com/unraid/api/compare/v4.19.1...v4.20.0) (2025-09-08)


### Features

* **disks:** add isSpinning field to Disk type ([#1527](https://github.com/unraid/api/issues/1527)) ([193be3d](https://github.com/unraid/api/commit/193be3df3672514be9904e3d4fbdff776470afc0))


### Bug Fixes

* better component loading to prevent per-page strange behavior ([095c222](https://github.com/unraid/api/commit/095c2221c94f144f8ad410a69362b15803765531))
* **deps:** pin dependencies ([#1669](https://github.com/unraid/api/issues/1669)) ([413db4b](https://github.com/unraid/api/commit/413db4bd30a06aa69d3ca86e793782854f822589))
* **plugin:** add fallback for unraid-api stop in deprecation cleanup ([#1668](https://github.com/unraid/api/issues/1668)) ([797bf50](https://github.com/unraid/api/commit/797bf50ec702ebc8244ff71a8ef1a80ea5cd2169))
* prepend 'v' to API version in workflow dispatch inputs ([f0cffbd](https://github.com/unraid/api/commit/f0cffbdc7ac36e7037ab60fe9dddbb2cab4a5e10))
* progress frame background color fix ([#1672](https://github.com/unraid/api/issues/1672)) ([785f1f5](https://github.com/unraid/api/commit/785f1f5eb1a1cc8b41f6eb502e4092d149cfbd80))
* properly override header values ([#1673](https://github.com/unraid/api/issues/1673)) ([aecf70f](https://github.com/unraid/api/commit/aecf70ffad60c83074347d3d6ec23f73acbd1aee))

## [4.19.1](https://github.com/unraid/api/compare/v4.19.0...v4.19.1) (2025-09-05)


### Bug Fixes

* custom path detection to fix setup issues ([#1664](https://github.com/unraid/api/issues/1664)) ([2ecdb99](https://github.com/unraid/api/commit/2ecdb99052f39d89af21bbe7ad3f80b83bb1eaa9))

## [4.19.0](https://github.com/unraid/api/compare/v4.18.2...v4.19.0) (2025-09-04)


### Features

* mount vue apps, not web components ([#1639](https://github.com/unraid/api/issues/1639)) ([88087d5](https://github.com/unraid/api/commit/88087d5201992298cdafa791d5d1b5bb23dcd72b))


### Bug Fixes

* api version json response ([#1653](https://github.com/unraid/api/issues/1653)) ([292bc0f](https://github.com/unraid/api/commit/292bc0fc810a0d0f0cce6813b0631ff25099cc05))
* enhance DOM validation and cleanup in vue-mount-app ([6cf7c88](https://github.com/unraid/api/commit/6cf7c88242f2f4fe9f83871560039767b5b90273))
* enhance getKeyFile function to handle missing key file gracefully ([#1659](https://github.com/unraid/api/issues/1659)) ([728b38a](https://github.com/unraid/api/commit/728b38ac11faeacd39ce9d0157024ad140e29b36))
* info alert docker icon ([#1661](https://github.com/unraid/api/issues/1661)) ([239cdd6](https://github.com/unraid/api/commit/239cdd6133690699348e61f68e485d2b54fdcbdb))
* oidc cache busting issues fixed ([#1656](https://github.com/unraid/api/issues/1656)) ([e204eb8](https://github.com/unraid/api/commit/e204eb80a00ab9242e3dca4ccfc3e1b55a7694b7))
* **plugin:** restore cleanup behavior for unsupported unraid versions ([#1658](https://github.com/unraid/api/issues/1658)) ([534a077](https://github.com/unraid/api/commit/534a07788b76de49e9ba14059a9aed0bf16e02ca))
* UnraidToaster component and update dialog close button ([#1657](https://github.com/unraid/api/issues/1657)) ([44774d0](https://github.com/unraid/api/commit/44774d0acdd25aa33cb60a5d0b4f80777f4068e5))
* vue mounting logic with tests ([#1651](https://github.com/unraid/api/issues/1651)) ([33774aa](https://github.com/unraid/api/commit/33774aa596124a031a7452b62ca4c43743a09951))

## [4.18.2](https://github.com/unraid/api/compare/v4.18.1...v4.18.2) (2025-09-03)


### Bug Fixes

* add missing CPU guest metrics to CPU responses ([#1644](https://github.com/unraid/api/issues/1644)) ([99dbad5](https://github.com/unraid/api/commit/99dbad57d55a256f5f3f850f9a47a6eaa6348065))
* **plugin:** raise minimum unraid os version to 6.12.15 ([#1649](https://github.com/unraid/api/issues/1649)) ([bc15bd3](https://github.com/unraid/api/commit/bc15bd3d7008acb416ac3c6fb1f4724c685ec7e7))
* update GitHub Actions token for workflow trigger ([4d8588b](https://github.com/unraid/api/commit/4d8588b17331afa45ba8caf84fcec8c0ea03591f))
* update OIDC URL validation and add tests ([#1646](https://github.com/unraid/api/issues/1646)) ([c7c3bb5](https://github.com/unraid/api/commit/c7c3bb57ea482633a7acff064b39fbc8d4e07213))
* use shared bg & border color for styled toasts ([#1647](https://github.com/unraid/api/issues/1647)) ([7c3aee8](https://github.com/unraid/api/commit/7c3aee8f3f9ba82ae8c8ed3840c20ab47f3cb00f))

## [4.18.1](https://github.com/unraid/api/compare/v4.18.0...v4.18.1) (2025-09-03)


### Bug Fixes

* OIDC and API Key management issues ([#1642](https://github.com/unraid/api/issues/1642)) ([0fe2c2c](https://github.com/unraid/api/commit/0fe2c2c1c85dcc547e4b1217a3b5636d7dd6d4b4))
* rm redundant emission to `$HOME/.pm2/logs` ([#1640](https://github.com/unraid/api/issues/1640)) ([a8e4119](https://github.com/unraid/api/commit/a8e4119270868a1dabccd405853a7340f8dcd8a5))

## [4.18.0](https://github.com/unraid/api/compare/v4.17.0...v4.18.0) (2025-09-02)


### Features

* **api:** enhance OIDC redirect URI handling in service and tests ([#1618](https://github.com/unraid/api/issues/1618)) ([4e945f5](https://github.com/unraid/api/commit/4e945f5f56ce059eb275a9576caf3194a5df8a90))


### Bug Fixes

* api key creation cli ([#1637](https://github.com/unraid/api/issues/1637)) ([c147a6b](https://github.com/unraid/api/commit/c147a6b5075969e77798210c4a5cfd1fa5b96ae3))
* **cli:** support `--log-level` for `start` and `restart` cmds ([#1623](https://github.com/unraid/api/issues/1623)) ([a1ee915](https://github.com/unraid/api/commit/a1ee915ca52e5a063eccf8facbada911a63f37f6))
* confusing server -&gt; status query ([#1635](https://github.com/unraid/api/issues/1635)) ([9d42b36](https://github.com/unraid/api/commit/9d42b36f74274cad72490da5152fdb98fdc5b89b))
* use unraid css variables in sonner ([#1634](https://github.com/unraid/api/issues/1634)) ([26a95af](https://github.com/unraid/api/commit/26a95af9539d05a837112d62dc6b7dd46761c83f))

## [4.17.0](https://github.com/unraid/api/compare/v4.16.0...v4.17.0) (2025-08-27)


### Features

* add tailwind class sort plugin ([#1562](https://github.com/unraid/api/issues/1562)) ([ab11e7f](https://github.com/unraid/api/commit/ab11e7ff7ff74da1f1cd5e49938459d00bfc846b))


### Bug Fixes

* cleanup obsoleted legacy api keys on api startup (cli / connect) ([#1630](https://github.com/unraid/api/issues/1630)) ([6469d00](https://github.com/unraid/api/commit/6469d002b7b18e49c77ee650a4255974ab43e790))

## [4.16.0](https://github.com/unraid/api/compare/v4.15.1...v4.16.0) (2025-08-27)


### Features

* add `parityCheckStatus` field to `array` query ([#1611](https://github.com/unraid/api/issues/1611)) ([c508366](https://github.com/unraid/api/commit/c508366702b9fa20d9ed05559fe73da282116aa6))
* generated UI API key management + OAuth-like API Key Flows ([#1609](https://github.com/unraid/api/issues/1609)) ([674323f](https://github.com/unraid/api/commit/674323fd87bbcc55932e6b28f6433a2de79b7ab0))


### Bug Fixes

* **connect:** clear `wanport` upon disabling remote access ([#1624](https://github.com/unraid/api/issues/1624)) ([9df6a3f](https://github.com/unraid/api/commit/9df6a3f5ebb0319aa7e3fe3be6159d39ec6f587f))
* **connect:** valid LAN FQDN while remote access is enabled ([#1625](https://github.com/unraid/api/issues/1625)) ([aa58888](https://github.com/unraid/api/commit/aa588883cc2e2fe4aa4aea1d035236c888638f5b))
* correctly parse periods in share names from ini file ([#1629](https://github.com/unraid/api/issues/1629)) ([7d67a40](https://github.com/unraid/api/commit/7d67a404333a38d6e1ba5c3febf02be8b1b71901))
* **rc.unraid-api:** remove profile sourcing ([#1622](https://github.com/unraid/api/issues/1622)) ([6947b5d](https://github.com/unraid/api/commit/6947b5d4aff70319116eb65cf4c639444f3749e9))
* remove unused api key calls ([#1628](https://github.com/unraid/api/issues/1628)) ([9cd0d6a](https://github.com/unraid/api/commit/9cd0d6ac658475efa25683ef6e3f2e1d68f7e903))
* retry VMs init for up to 2 min ([#1612](https://github.com/unraid/api/issues/1612)) ([b2e7801](https://github.com/unraid/api/commit/b2e78012384e6b3f2630341281fc811026be23b9))

## [4.15.1](https://github.com/unraid/api/compare/v4.15.0...v4.15.1) (2025-08-20)


### Bug Fixes

* minor duplicate click handler and version resolver nullability issue ([ac198d5](https://github.com/unraid/api/commit/ac198d5d1a3073fdeb053c2ff8f704b0dba0d047))

## [4.15.0](https://github.com/unraid/api/compare/v4.14.0...v4.15.0) (2025-08-20)


### Features

* **api:** restructure versioning information in GraphQL schema ([#1600](https://github.com/unraid/api/issues/1600)) ([d0c6602](https://github.com/unraid/api/commit/d0c66020e1d1d5b6fcbc4ee8979bba4b3d34c7ad))

## [4.14.0](https://github.com/unraid/api/compare/v4.13.1...v4.14.0) (2025-08-19)


### Features

* **api:** add cpu utilization query and subscription ([#1590](https://github.com/unraid/api/issues/1590)) ([2b4c2a2](https://github.com/unraid/api/commit/2b4c2a264bb2769f88c3000d16447889cae57e98))
* enhance OIDC claim evaluation with array handling ([#1596](https://github.com/unraid/api/issues/1596)) ([b7798b8](https://github.com/unraid/api/commit/b7798b82f44aae9a428261270fd9dbde35ff7751))


### Bug Fixes

* remove unraid-api sso users & always apply sso modification on &lt; 7.2 ([#1595](https://github.com/unraid/api/issues/1595)) ([4262830](https://github.com/unraid/api/commit/426283011afd41e3af7e48cfbb2a2d351c014bd1))
* update Docusaurus PR workflow to process and copy API docs ([3a10871](https://github.com/unraid/api/commit/3a10871918fe392a1974b69d16a135546166e058))
* update OIDC provider setup documentation for navigation clarity ([1a01696](https://github.com/unraid/api/commit/1a01696dc7b947abf5f2f097de1b231d5593c2ff))
* update OIDC provider setup documentation for redirect URI and screenshots ([1bc5251](https://github.com/unraid/api/commit/1bc52513109436b3ce8237c3796af765e208f9fc))

## [4.13.1](https://github.com/unraid/api/compare/v4.13.0...v4.13.1) (2025-08-15)


### Bug Fixes

* insecure routes not working for SSO ([#1587](https://github.com/unraid/api/issues/1587)) ([a4ff3c4](https://github.com/unraid/api/commit/a4ff3c40926915f6989ed4af679b30cf295ea15d))

## [4.13.0](https://github.com/unraid/api/compare/v4.12.0...v4.13.0) (2025-08-15)


### Features

* `createDockerFolder` & `setDockerFolderChildren` mutations ([#1558](https://github.com/unraid/api/issues/1558)) ([557b03f](https://github.com/unraid/api/commit/557b03f8829d3f179b5e26162fa250121cb33420))
* `deleteDockerEntries` mutation ([#1564](https://github.com/unraid/api/issues/1564)) ([78997a0](https://github.com/unraid/api/commit/78997a02c6d96ec0ed75352dfc9849524147428c))
* add `moveDockerEntriesToFolder` mutation ([#1569](https://github.com/unraid/api/issues/1569)) ([20c2d5b](https://github.com/unraid/api/commit/20c2d5b4457ad50d1e287fb3141aa98e8e7de665))
* add docker -&gt; organizer query ([#1555](https://github.com/unraid/api/issues/1555)) ([dfe352d](https://github.com/unraid/api/commit/dfe352dfa1bd6aa059cab56357ba6bff5e8ed7cb))
* connect settings page updated for responsive webgui ([#1585](https://github.com/unraid/api/issues/1585)) ([96c120f](https://github.com/unraid/api/commit/96c120f9b24d3c91df5e9401917c8994eef36c46))
* implement OIDC provider management in GraphQL API ([#1563](https://github.com/unraid/api/issues/1563)) ([979a267](https://github.com/unraid/api/commit/979a267bc5e128a8b789f0123e23c61860ebb11b))


### Bug Fixes

* change config file loading error log to debug ([#1565](https://github.com/unraid/api/issues/1565)) ([3534d6f](https://github.com/unraid/api/commit/3534d6fdd7c59e65615167cfe306deebad9ca4d3))
* **connect:** remove unraid-api folder before creating symlink ([#1556](https://github.com/unraid/api/issues/1556)) ([514a0ef](https://github.com/unraid/api/commit/514a0ef560a90595f774b6c0db60f1d2b4cd853c))
* **deps:** pin dependencies ([#1586](https://github.com/unraid/api/issues/1586)) ([5721785](https://github.com/unraid/api/commit/57217852a337ead4c8c8e7596d1b7d590b64a26f))
* **deps:** update all non-major dependencies ([#1543](https://github.com/unraid/api/issues/1543)) ([18b5209](https://github.com/unraid/api/commit/18b52090874c0ba86878d0f7e31bf0dc42734d75))
* **deps:** update all non-major dependencies ([#1579](https://github.com/unraid/api/issues/1579)) ([ad6aa3b](https://github.com/unraid/api/commit/ad6aa3b6743aeeb42eff34d1c89ad874dfd0af09))
* refactor API client to support Unix socket connections ([#1575](https://github.com/unraid/api/issues/1575)) ([a2c5d24](https://github.com/unraid/api/commit/a2c5d2495ffc02efa1ec5c63f0a1c5d23c9ed7ff))
* **theme:** API key white text on white background ([#1584](https://github.com/unraid/api/issues/1584)) ([b321687](https://github.com/unraid/api/commit/b3216874faae208cdfc3edec719629fce428b6a3))

## [4.12.0](https://github.com/unraid/api/compare/v4.11.0...v4.12.0) (2025-07-30)


### Features

* add ups monitoring to graphql api ([#1526](https://github.com/unraid/api/issues/1526)) ([6ea94f0](https://github.com/unraid/api/commit/6ea94f061d5b2e6c6fbfa6949006960501e3f4e7))


### Bug Fixes

* enhance plugin management with interactive removal prompts ([#1549](https://github.com/unraid/api/issues/1549)) ([23ef760](https://github.com/unraid/api/commit/23ef760d763c525a38108048200fa73fc8531aed))
* remove connect api plugin upon removal of Connect Unraid plugin ([#1548](https://github.com/unraid/api/issues/1548)) ([782d5eb](https://github.com/unraid/api/commit/782d5ebadc67854298f3b2355255983024d2a225))
* SSO not being detected ([#1546](https://github.com/unraid/api/issues/1546)) ([6b3b951](https://github.com/unraid/api/commit/6b3b951d8288cd31d096252be544537dc2bfce50))

## [4.11.0](https://github.com/unraid/api/compare/v4.10.0...v4.11.0) (2025-07-28)


### Features

* tailwind v4 ([#1522](https://github.com/unraid/api/issues/1522)) ([2c62e0a](https://github.com/unraid/api/commit/2c62e0ad09c56d2293b76d07833dfb142c898937))
* **web:** install and configure nuxt ui ([#1524](https://github.com/unraid/api/issues/1524)) ([407585c](https://github.com/unraid/api/commit/407585cd40c409175d8e7b861f8d61d8cabc11c9))


### Bug Fixes

* add missing breakpoints ([#1535](https://github.com/unraid/api/issues/1535)) ([f5352e3](https://github.com/unraid/api/commit/f5352e3a26a2766e85d19ffb5f74960c536b91b3))
* border color incorrect in tailwind ([#1544](https://github.com/unraid/api/issues/1544)) ([f14b74a](https://github.com/unraid/api/commit/f14b74af91783b08640c0949c51ba7f18508f06f))
* **connect:** omit extraneous fields during connect config validation ([#1538](https://github.com/unraid/api/issues/1538)) ([45bd736](https://github.com/unraid/api/commit/45bd73698b2bd534a8aff2c6ac73403de6c58561))
* **deps:** pin dependencies ([#1528](https://github.com/unraid/api/issues/1528)) ([a74d935](https://github.com/unraid/api/commit/a74d935b566dd7af1a21824c9b7ab562232f9d8b))
* **deps:** pin dependency @nuxt/ui to 3.2.0 ([#1532](https://github.com/unraid/api/issues/1532)) ([8279531](https://github.com/unraid/api/commit/8279531f2b86a78e81a77e6c037a0fb752e98062))
* **deps:** update all non-major dependencies ([#1510](https://github.com/unraid/api/issues/1510)) ([1a8da6d](https://github.com/unraid/api/commit/1a8da6d92b96d3afa2a8b42446b36f1ee98b64a0))
* **deps:** update all non-major dependencies ([#1520](https://github.com/unraid/api/issues/1520)) ([e2fa648](https://github.com/unraid/api/commit/e2fa648d1cf5a6cbe3e55c3f52c203d26bb4d526))
* inject Tailwind CSS into client entry point ([#1537](https://github.com/unraid/api/issues/1537)) ([86b6c4f](https://github.com/unraid/api/commit/86b6c4f85b7b30bb4a13d57450a76bf4c28a3fff))
* make settings grid responsive ([#1463](https://github.com/unraid/api/issues/1463)) ([9dfdb8d](https://github.com/unraid/api/commit/9dfdb8dce781fa662d6434ee432e4521f905ffa5))
* **notifications:** gracefully handle & mask invalid notifications ([#1529](https://github.com/unraid/api/issues/1529)) ([05056e7](https://github.com/unraid/api/commit/05056e7ca1702eb7bf6c507950460b6b15bf7916))
* truncate log files when they take up more than 5mb of space ([#1530](https://github.com/unraid/api/issues/1530)) ([0a18b38](https://github.com/unraid/api/commit/0a18b38008dd86a125cde7f684636d5dbb36f082))
* use async for primary file read/writes ([#1531](https://github.com/unraid/api/issues/1531)) ([23b2b88](https://github.com/unraid/api/commit/23b2b8846158a27d1c9808bce0cc1506779c4dc3))

## [4.10.0](https://github.com/unraid/api/compare/v4.9.5...v4.10.0) (2025-07-15)


### Features

* trial extension allowed within 5 days of expiration ([#1490](https://github.com/unraid/api/issues/1490)) ([f34a33b](https://github.com/unraid/api/commit/f34a33bc9f1a7e135d453d9d31888789bfc3f878))


### Bug Fixes

* delay `nginx:reload` file mod effect by 10 seconds ([#1512](https://github.com/unraid/api/issues/1512)) ([af33e99](https://github.com/unraid/api/commit/af33e999a0480a77e3e6b2aa833b17b38b835656))
* **deps:** update all non-major dependencies ([#1489](https://github.com/unraid/api/issues/1489)) ([53b05eb](https://github.com/unraid/api/commit/53b05ebe5e2050cb0916fcd65e8d41370aee0624))
* ensure no crash if emhttp state configs are missing ([#1514](https://github.com/unraid/api/issues/1514)) ([1a7d35d](https://github.com/unraid/api/commit/1a7d35d3f6972fd8aff58c17b2b0fb79725e660e))
* **my.servers:** improve DNS resolution robustness for backup server ([#1518](https://github.com/unraid/api/issues/1518)) ([eecd9b1](https://github.com/unraid/api/commit/eecd9b1017a63651d1dc782feaa224111cdee8b6))
* over-eager cloud query from web components ([#1506](https://github.com/unraid/api/issues/1506)) ([074370c](https://github.com/unraid/api/commit/074370c42cdecc4dbc58193ff518aa25735c56b3))
* replace myservers.cfg reads in UpdateFlashBackup.php ([#1517](https://github.com/unraid/api/issues/1517)) ([441e180](https://github.com/unraid/api/commit/441e1805c108a6c1cd35ee093246b975a03f8474))
* rm short-circuit in `rc.unraid-api` if plugin config dir is absent ([#1515](https://github.com/unraid/api/issues/1515)) ([29dcb7d](https://github.com/unraid/api/commit/29dcb7d0f088937cefc5158055f48680e86e5c36))

## [4.9.5](https://github.com/unraid/api/compare/v4.9.4...v4.9.5) (2025-07-10)


### Bug Fixes

* **connect:** rm eager restart on `ERROR_RETYING` connection status ([#1502](https://github.com/unraid/api/issues/1502)) ([dd759d9](https://github.com/unraid/api/commit/dd759d9f0f841b296f8083bc67c6cd3f7a69aa5b))

## [4.9.4](https://github.com/unraid/api/compare/v4.9.3...v4.9.4) (2025-07-09)


### Bug Fixes

* backport `<unraid-modals>` upon plg install when necessary ([#1499](https://github.com/unraid/api/issues/1499)) ([33e0b1a](https://github.com/unraid/api/commit/33e0b1ab24bedb6a2c7b376ea73dbe65bc3044be))
* DefaultPageLayout patch rollback omits legacy header logo ([#1497](https://github.com/unraid/api/issues/1497)) ([ea20d1e](https://github.com/unraid/api/commit/ea20d1e2116fcafa154090fee78b42ec5d9ba584))
* event emitter setup for writing status ([#1496](https://github.com/unraid/api/issues/1496)) ([ca4e2db](https://github.com/unraid/api/commit/ca4e2db1f29126a1fa3784af563832edda64b0ca))

## [4.9.3](https://github.com/unraid/api/compare/v4.9.2...v4.9.3) (2025-07-09)


### Bug Fixes

* duplicated header logo after api stops ([#1493](https://github.com/unraid/api/issues/1493)) ([4168f43](https://github.com/unraid/api/commit/4168f43e3ecd51479bec3aae585abbe6dcd3e416))

## [4.9.2](https://github.com/unraid/api/compare/v4.9.1...v4.9.2) (2025-07-09)


### Bug Fixes

* invalid configs no longer crash API ([#1491](https://github.com/unraid/api/issues/1491)) ([6bf3f77](https://github.com/unraid/api/commit/6bf3f776380edeff5133517e6aca223556e30144))
* invalid state for unraid plugin ([#1492](https://github.com/unraid/api/issues/1492)) ([39b8f45](https://github.com/unraid/api/commit/39b8f453da23793ef51f8e7f7196370aada8c5aa))
* release note escaping ([5b6bcb6](https://github.com/unraid/api/commit/5b6bcb6043a5269bff4dc28714d787a5a3f07e22))

## [4.9.1](https://github.com/unraid/api/compare/v4.9.0...v4.9.1) (2025-07-08)


### Bug Fixes

* **HeaderOsVersion:** adjust top margin for header component ([#1485](https://github.com/unraid/api/issues/1485)) ([862b54d](https://github.com/unraid/api/commit/862b54de8cd793606f1d29e76c19d4a0e1ae172f))
* sign out doesn't work ([#1486](https://github.com/unraid/api/issues/1486)) ([f3671c3](https://github.com/unraid/api/commit/f3671c3e0750b79be1f19655a07a0e9932289b3f))

## [4.9.0](https://github.com/unraid/api/compare/v4.8.0...v4.9.0) (2025-07-08)


### Features

* add graphql resource for API plugins ([#1420](https://github.com/unraid/api/issues/1420)) ([642a220](https://github.com/unraid/api/commit/642a220c3a796829505d8449dc774968c9d5c222))
* add management page for API keys ([#1408](https://github.com/unraid/api/issues/1408)) ([0788756](https://github.com/unraid/api/commit/0788756b918a8e99be51f34bf6f96bbe5b67395a))
* add rclone ([#1362](https://github.com/unraid/api/issues/1362)) ([5517e75](https://github.com/unraid/api/commit/5517e7506b05c7bef5012bb9f8d2103e91061997))
* API key management ([#1407](https://github.com/unraid/api/issues/1407)) ([d37dc3b](https://github.com/unraid/api/commit/d37dc3bce28bad1c893ae7eff96ca5ffd9177648))
* api plugin management via CLI ([#1416](https://github.com/unraid/api/issues/1416)) ([3dcbfbe](https://github.com/unraid/api/commit/3dcbfbe48973b8047f0c6c560068808d86ac6970))
* build out docker components  ([#1427](https://github.com/unraid/api/issues/1427)) ([711cc9a](https://github.com/unraid/api/commit/711cc9ac926958bcf2996455b023ad265b041530))
* docker and info resolver issues ([#1423](https://github.com/unraid/api/issues/1423)) ([9901039](https://github.com/unraid/api/commit/9901039a3863de06b520e23cb2573b610716c673))
* fix shading in UPC to be less severe ([#1438](https://github.com/unraid/api/issues/1438)) ([b7c2407](https://github.com/unraid/api/commit/b7c240784052276fc60e064bd7d64dd6e801ae90))
* info resolver cleanup ([#1425](https://github.com/unraid/api/issues/1425)) ([1b279bb](https://github.com/unraid/api/commit/1b279bbab3a51e7d032e7e3c9898feac8bfdbafa))
* initial codeql setup ([#1390](https://github.com/unraid/api/issues/1390)) ([2ade7eb](https://github.com/unraid/api/commit/2ade7eb52792ef481aaf711dc07029629ea107d9))
* initialize claude code in codebse ([#1418](https://github.com/unraid/api/issues/1418)) ([b6c4ee6](https://github.com/unraid/api/commit/b6c4ee6eb4b9ebb6d6e59a341e1f51b253578752))
* move api key fetching to use api key service ([#1439](https://github.com/unraid/api/issues/1439)) ([86bea56](https://github.com/unraid/api/commit/86bea5627270a2a18c5b7db36dd59061ab61e753))
* move to cron v4 ([#1428](https://github.com/unraid/api/issues/1428)) ([b8035c2](https://github.com/unraid/api/commit/b8035c207a6e387c7af3346593a872664f6c867b))
* move to iframe for changelog ([#1388](https://github.com/unraid/api/issues/1388)) ([fcd6fbc](https://github.com/unraid/api/commit/fcd6fbcdd48e7f224b3bd8799a668d9e01967f0c))
* native slackware package ([#1381](https://github.com/unraid/api/issues/1381)) ([4f63b4c](https://github.com/unraid/api/commit/4f63b4cf3bb9391785f07a38defe54ec39071caa))
* send active unraid theme to docs ([#1400](https://github.com/unraid/api/issues/1400)) ([f71943b](https://github.com/unraid/api/commit/f71943b62b30119e17766e56534962630f52a591))
* slightly better watch mode ([#1398](https://github.com/unraid/api/issues/1398)) ([881f1e0](https://github.com/unraid/api/commit/881f1e09607d1e4a8606f8d048636ba09d8fcac1))
* upgrade nuxt-custom-elements ([#1461](https://github.com/unraid/api/issues/1461)) ([345e83b](https://github.com/unraid/api/commit/345e83bfb0904381d784fc77b3dcd3ad7e53d898))
* use bigint instead of long ([#1403](https://github.com/unraid/api/issues/1403)) ([574d572](https://github.com/unraid/api/commit/574d572d6567c652057b29776694e86267316ca7))


### Bug Fixes

* activation indicator removed ([5edfd82](https://github.com/unraid/api/commit/5edfd823b862cfc1f864565021f12334fe9317c6))
* alignment of settings on ManagementAccess settings page ([#1421](https://github.com/unraid/api/issues/1421)) ([70c790f](https://github.com/unraid/api/commit/70c790ff89075a785d7f0623bbf3c34a3806bbdc))
* allow rclone to fail to initialize ([#1453](https://github.com/unraid/api/issues/1453)) ([7c6f02a](https://github.com/unraid/api/commit/7c6f02a5cb474fb285db294ec6f80d1c2c57e142))
* always download 7.1 versioned files for patching ([edc0d15](https://github.com/unraid/api/commit/edc0d1578b89c3b3e56e637de07137e069656fa8))
* api `pnpm type-check` ([#1442](https://github.com/unraid/api/issues/1442)) ([3122bdb](https://github.com/unraid/api/commit/3122bdb953eec58469fd9cf6f468e75621781040))
* **api:** connect config `email` validation ([#1454](https://github.com/unraid/api/issues/1454)) ([b9a1b9b](https://github.com/unraid/api/commit/b9a1b9b08746b6d4cb2128d029a3dab7cdd47677))
* backport unraid/webgui[#2269](https://github.com/unraid/api/issues/2269) rc.nginx update ([#1436](https://github.com/unraid/api/issues/1436)) ([a7ef06e](https://github.com/unraid/api/commit/a7ef06ea252545cef084e21cea741a8ec866e7cc))
* bigint ([e54d27a](https://github.com/unraid/api/commit/e54d27aede1b1e784971468777c5e65cde66f2ac))
* config migration from `myservers.cfg` ([#1440](https://github.com/unraid/api/issues/1440)) ([c4c9984](https://github.com/unraid/api/commit/c4c99843c7104414120bffc5dd5ed78ab6c8ba02))
* **connect:** fatal race-condition in websocket disposal ([#1462](https://github.com/unraid/api/issues/1462)) ([0ec0de9](https://github.com/unraid/api/commit/0ec0de982f017b61a145c7a4176718b484834f41))
* **connect:** mothership connection ([#1464](https://github.com/unraid/api/issues/1464)) ([7be8bc8](https://github.com/unraid/api/commit/7be8bc84d3831f9cea7ff62d0964612ad366a976))
* console hidden ([9b85e00](https://github.com/unraid/api/commit/9b85e009b833706294a841a54498e45a8e0204ed))
* debounce is too long ([#1426](https://github.com/unraid/api/issues/1426)) ([f12d231](https://github.com/unraid/api/commit/f12d231e6376d0f253cee67b7ed690c432c63ec5))
* delete legacy connect keys and ensure description ([22fe91c](https://github.com/unraid/api/commit/22fe91cd561e88aa24e8f8cfa5a6143e7644e4e0))
* **deps:** pin dependencies ([#1465](https://github.com/unraid/api/issues/1465)) ([ba75a40](https://github.com/unraid/api/commit/ba75a409a4d3e820308b78fd5a5380021d3757b0))
* **deps:** pin dependencies ([#1470](https://github.com/unraid/api/issues/1470)) ([412b329](https://github.com/unraid/api/commit/412b32996d9c8352c25309cc0d549a57468d0fb5))
* **deps:** storybook v9 ([#1476](https://github.com/unraid/api/issues/1476)) ([45bb49b](https://github.com/unraid/api/commit/45bb49bcd60a9753be492203111e489fd37c1a5f))
* **deps:** update all non-major dependencies ([#1366](https://github.com/unraid/api/issues/1366)) ([291ee47](https://github.com/unraid/api/commit/291ee475fb9ef44f6da7b76a9eb11b7dd29a5d13))
* **deps:** update all non-major dependencies ([#1379](https://github.com/unraid/api/issues/1379)) ([8f70326](https://github.com/unraid/api/commit/8f70326d0fe3e4c3bcd3e8e4e6566766f1c05eb7))
* **deps:** update all non-major dependencies ([#1389](https://github.com/unraid/api/issues/1389)) ([cb43f95](https://github.com/unraid/api/commit/cb43f95233590888a8e20a130e62cadc176c6793))
* **deps:** update all non-major dependencies ([#1399](https://github.com/unraid/api/issues/1399)) ([68df344](https://github.com/unraid/api/commit/68df344a4b412227cffa96867f086177b251f028))
* **deps:** update dependency @types/diff to v8 ([#1393](https://github.com/unraid/api/issues/1393)) ([00da27d](https://github.com/unraid/api/commit/00da27d04f2ee2ca8b8b9cdcc6ea3c490c02a3a4))
* **deps:** update dependency cache-manager to v7 ([#1413](https://github.com/unraid/api/issues/1413)) ([9492c2a](https://github.com/unraid/api/commit/9492c2ae6a0086d14e73d280c55746206b73a7b0))
* **deps:** update dependency commander to v14 ([#1394](https://github.com/unraid/api/issues/1394)) ([106ea09](https://github.com/unraid/api/commit/106ea093996f2d0c71c1511bc009ecc9a6be91ec))
* **deps:** update dependency diff to v8 ([#1386](https://github.com/unraid/api/issues/1386)) ([e580f64](https://github.com/unraid/api/commit/e580f646a52b8bda605132cf44ec58137e08dd42))
* **deps:** update dependency dotenv to v17 ([#1474](https://github.com/unraid/api/issues/1474)) ([d613bfa](https://github.com/unraid/api/commit/d613bfa0410e7ef8451fc8ea20e57a7db67f7994))
* **deps:** update dependency lucide-vue-next to ^0.509.0 ([#1383](https://github.com/unraid/api/issues/1383)) ([469333a](https://github.com/unraid/api/commit/469333acd4a0cbeecc9e9cbadb2884289d83aee3))
* **deps:** update dependency marked to v16 ([#1444](https://github.com/unraid/api/issues/1444)) ([453a5b2](https://github.com/unraid/api/commit/453a5b2c9591f755ce07548a9996d7a6cf0925c4))
* **deps:** update dependency shadcn-vue to v2 ([#1302](https://github.com/unraid/api/issues/1302)) ([26ecf77](https://github.com/unraid/api/commit/26ecf779e675d0bc533d61e045325ab062effcbf))
* **deps:** update dependency vue-sonner to v2 ([#1401](https://github.com/unraid/api/issues/1401)) ([53ca414](https://github.com/unraid/api/commit/53ca41404f13c057c340dcf9010af72c3365e499))
* disable file changes on Unraid 7.2 ([#1382](https://github.com/unraid/api/issues/1382)) ([02de89d](https://github.com/unraid/api/commit/02de89d1309f67e4b6d4f8de5f66815ee4d2464c))
* do not start API with doinst.sh ([7d88b33](https://github.com/unraid/api/commit/7d88b3393cbd8ab1e93a86dfa1b7b74cc97255cc))
* do not uninstall fully on 7.2 ([#1484](https://github.com/unraid/api/issues/1484)) ([2263881](https://github.com/unraid/api/commit/22638811a9fdb524420b1347ac49cfaa51bbecb5))
* drop console with terser ([a87d455](https://github.com/unraid/api/commit/a87d455bace04aab9d7fa0e63cb61d26ef9b3b72))
* error logs from `cloud` query when connect is not installed ([#1450](https://github.com/unraid/api/issues/1450)) ([719f460](https://github.com/unraid/api/commit/719f460016d769255582742d7d71ca97d132022b))
* flash backup integration with Unraid Connect config ([#1448](https://github.com/unraid/api/issues/1448)) ([038c582](https://github.com/unraid/api/commit/038c582aed5f5efaea3583372778b9baa318e1ea))
* header padding regression ([#1477](https://github.com/unraid/api/issues/1477)) ([e791cc6](https://github.com/unraid/api/commit/e791cc680de9c40378043348ddca70902da6d250))
* incorrect state merging in redux store ([#1437](https://github.com/unraid/api/issues/1437)) ([17b7428](https://github.com/unraid/api/commit/17b74287796e6feb75466033e279dc3bcf57f1e6))
* lanip copy button not present ([#1459](https://github.com/unraid/api/issues/1459)) ([a280786](https://github.com/unraid/api/commit/a2807864acef742e454d87bb093ee91806e527e5))
* move to bigint scalar ([b625227](https://github.com/unraid/api/commit/b625227913e80e4731a13b54b525ec7385918c51))
* node_modules dir removed on plugin update ([#1406](https://github.com/unraid/api/issues/1406)) ([7b005cb](https://github.com/unraid/api/commit/7b005cbbf682a1336641f5fc85022e9d651569d0))
* omit Connect actions in UPC when plugin is not installed ([#1417](https://github.com/unraid/api/issues/1417)) ([8c8a527](https://github.com/unraid/api/commit/8c8a5276b49833c08bca133e374e1e66273b41aa))
* parsing of `ssoEnabled` in state.php ([#1455](https://github.com/unraid/api/issues/1455)) ([f542c8e](https://github.com/unraid/api/commit/f542c8e0bd9596d9d3abf75b58b97d95fb033215))
* pin ranges ([#1460](https://github.com/unraid/api/issues/1460)) ([f88400e](https://github.com/unraid/api/commit/f88400eea820ac80c867fdb63cd503ed91493146))
* pr plugin promotion workflow ([#1456](https://github.com/unraid/api/issues/1456)) ([13bd9bb](https://github.com/unraid/api/commit/13bd9bb5670bb96b158068114d62572d88c7cae9))
* proper fallback if missing paths config modules ([7067e9e](https://github.com/unraid/api/commit/7067e9e3dd3966309013b52c90090cc82de4e4fb))
* rc.unraid-api now cleans up older dependencies ([#1404](https://github.com/unraid/api/issues/1404)) ([83076bb](https://github.com/unraid/api/commit/83076bb94088095de8b1a332a50bbef91421f0c1))
* remote access lifecycle during boot & shutdown ([#1422](https://github.com/unraid/api/issues/1422)) ([7bc583b](https://github.com/unraid/api/commit/7bc583b18621c8140232772ca36c6d9b8d8a9cd7))
* sign out correctly on error ([#1452](https://github.com/unraid/api/issues/1452)) ([d08fc94](https://github.com/unraid/api/commit/d08fc94afb94e386907da44402ee5a24cfb3d00a))
* simplify usb listing ([#1402](https://github.com/unraid/api/issues/1402)) ([5355115](https://github.com/unraid/api/commit/5355115af2f4122af9afa3f63ed8f830b33cbf5c))
* theme issues when sent from graph ([#1424](https://github.com/unraid/api/issues/1424)) ([75ad838](https://github.com/unraid/api/commit/75ad8381bd4f4045ab1d3aa84e08ecddfba27617))
* **ui:** notifications positioning regression ([#1445](https://github.com/unraid/api/issues/1445)) ([f73e5e0](https://github.com/unraid/api/commit/f73e5e0058fcc3bedebfbe7380ffcb44aea981b8))
* use some instead of every for connect detection ([9ce2fee](https://github.com/unraid/api/commit/9ce2fee380c4db1395f5d4df7f16ae6c57d1a748))


### Reverts

* revert package.json dependency updates from commit 711cc9a for api and packages/* ([94420e4](https://github.com/unraid/api/commit/94420e4d45735b8def3915b5789c15c1c3121f1e))

## [4.8.0](https://github.com/unraid/api/compare/v4.7.0...v4.8.0) (2025-05-01)


### Features

* move activation code logic into the API ([#1369](https://github.com/unraid/api/issues/1369)) ([39e83b2](https://github.com/unraid/api/commit/39e83b2aa156586ab4da362137194280fccefe7c))


### Bug Fixes

* 400 error when submitting connect settings ([831050f](https://github.com/unraid/api/commit/831050f4e8c3af4cbcc123a3a609025f250f0824))

## [4.7.0](https://github.com/unraid/api/compare/v4.6.6...v4.7.0) (2025-04-24)


### Features

* add basic docker network listing ([#1317](https://github.com/unraid/api/issues/1317)) ([c4fdff8](https://github.com/unraid/api/commit/c4fdff8149eb2812707605b3a98eabc795d18c5e))
* add permission documentation by using a custom decorator ([#1355](https://github.com/unraid/api/issues/1355)) ([45ecab6](https://github.com/unraid/api/commit/45ecab6914e2e4dd48438352eb9a5084a6a4b996))
* basic vm controls ([#1293](https://github.com/unraid/api/issues/1293)) ([bc3ca92](https://github.com/unraid/api/commit/bc3ca92fb02387bc019bb001809df96974737b50))
* code first graphql ([#1347](https://github.com/unraid/api/issues/1347)) ([f5724ab](https://github.com/unraid/api/commit/f5724abffbcb8c8a4885c487df4119787fd1d541))


### Bug Fixes

* container names always null ([#1335](https://github.com/unraid/api/issues/1335)) ([8a5b238](https://github.com/unraid/api/commit/8a5b23856c006827229812e558f7d1af92be80e0))
* **deps:** update all non-major dependencies ([#1337](https://github.com/unraid/api/issues/1337)) ([2345732](https://github.com/unraid/api/commit/234573264cfed1409a767927ff95f132be393ea9))
* hide reboot notice for patch releases ([#1341](https://github.com/unraid/api/issues/1341)) ([4b57439](https://github.com/unraid/api/commit/4b5743906a172f84bb46011fe2c3e0c8f64059a2))
* move docker mutations to the mutations resolver ([#1333](https://github.com/unraid/api/issues/1333)) ([1bbe7d2](https://github.com/unraid/api/commit/1bbe7d27b0e87b5ffcd57ac9cc28e64b046055be))
* PR build issue ([457d338](https://github.com/unraid/api/commit/457d338150774ddc14cde6562e226a6a565aca48))
* remove some unused fields from the report object ([#1342](https://github.com/unraid/api/issues/1342)) ([cd323ac](https://github.com/unraid/api/commit/cd323acd4905a558786b029ff5a30371c4512956))
* sso unreliable if API outputs more than raw json ([#1353](https://github.com/unraid/api/issues/1353)) ([e65775f](https://github.com/unraid/api/commit/e65775f8782714d1cc29c8f2801244b5a4043409))
* vms now can detect starting of libvirt and start local hypervisor ([#1356](https://github.com/unraid/api/issues/1356)) ([ad0f4c8](https://github.com/unraid/api/commit/ad0f4c8b55c7f7e94fbae2108f17715b1373a3ef))

## [4.6.6](https://github.com/unraid/api/compare/v4.6.5...v4.6.6) (2025-04-03)


### Bug Fixes

* issue with invalid builds for prod and tagging ([7e89cd2](https://github.com/unraid/api/commit/7e89cd2a3e06a4abc8164f2f4985ad9f6cc9388d))

## [4.6.5](https://github.com/unraid/api/compare/v4.6.4...v4.6.5) (2025-04-03)


### Bug Fixes

* unique artifact ID ([0f682b5](https://github.com/unraid/api/commit/0f682b5f23f4319a1ad8f0e8f2b5e5ae0a2293db))

## [4.6.4](https://github.com/unraid/api/compare/v4.6.3...v4.6.4) (2025-04-03)


### Bug Fixes

* cleanup build pipeline ([#1326](https://github.com/unraid/api/issues/1326)) ([60f16bd](https://github.com/unraid/api/commit/60f16bde416993771fce2ad5861a671504af4b7d))
* remove unneeded workflow secret pass ([4bb00dd](https://github.com/unraid/api/commit/4bb00dd981384083cec40d804209ec2ca18d7aae))

## [4.6.3](https://github.com/unraid/api/compare/v4.6.2...v4.6.3) (2025-04-03)


### Bug Fixes

* copy dynamix.unraid.net ([662d5f6](https://github.com/unraid/api/commit/662d5f64c94586e35bfdaae2df0716c3754b2c45))
* make backup of txz ([37e72f9](https://github.com/unraid/api/commit/37e72f9729f6ab385ed1070fbdca6028688fbd92))
* ordering in build script ([a562f77](https://github.com/unraid/api/commit/a562f7716380bde4a1ae0d6960eff51c37b9291c))

## [4.6.2](https://github.com/unraid/api/compare/v4.6.1...v4.6.2) (2025-04-03)


### Bug Fixes

* build issue ([99d8b31](https://github.com/unraid/api/commit/99d8b31fa8bef13ae6c7dcf74593bc2999a676ed))

## [4.6.1](https://github.com/unraid/api/compare/v4.6.0...v4.6.1) (2025-04-03)


### Bug Fixes

* don't mv deploy on prod release ([9568aab](https://github.com/unraid/api/commit/9568aabd17fbab9e7e2f06f723ee57dc2026583c))

## [4.6.0](https://github.com/unraid/api/compare/v4.5.0...v4.6.0) (2025-04-03)


### Features

* add gui settings field for sso users ([#1310](https://github.com/unraid/api/issues/1310)) ([5ba3fa6](https://github.com/unraid/api/commit/5ba3fa67a26828f29e1e234c6838e7beaa3fdff3))


### Bug Fixes

* build ([ed67af9](https://github.com/unraid/api/commit/ed67af956802eec95845519997bc15b32c84c6ee))
* **plugin:** flaky masking of benign warning during pnpm install ([#1313](https://github.com/unraid/api/issues/1313)) ([1f10b63](https://github.com/unraid/api/commit/1f10b63c8b015e9a2527f79e15a7042feb2d2aca))

## [4.5.0](https://github.com/unraid/api/compare/v4.4.1...v4.5.0) (2025-04-02)


### Features

* add webgui theme switcher component ([#1304](https://github.com/unraid/api/issues/1304)) ([e2d00dc](https://github.com/unraid/api/commit/e2d00dc3464f9663062ac759a8aad85e61804b91))
* api plugin system & offline versioned dependency vendoring ([#1252](https://github.com/unraid/api/issues/1252)) ([9f492bf](https://github.com/unraid/api/commit/9f492bf2175b1b909d3bec079ce901ba34765eb7))
* **api:** add `unraid-api --delete` command ([#1289](https://github.com/unraid/api/issues/1289)) ([2f09445](https://github.com/unraid/api/commit/2f09445f2ed6b23cd851ca64ac5b84cfde3cbd50))
* basic array controls ([#1291](https://github.com/unraid/api/issues/1291)) ([61fe696](https://github.com/unraid/api/commit/61fe6966caf973eec3d74c67741302dd4b507134))
* basic docker controls ([#1292](https://github.com/unraid/api/issues/1292)) ([12eddf8](https://github.com/unraid/api/commit/12eddf894e1808b61f5d4e007f3a7a39a3f2e4d6))
* copy to webgui repo script docs + wc build options ([#1285](https://github.com/unraid/api/issues/1285)) ([e54f189](https://github.com/unraid/api/commit/e54f189630f70aeff5af6bdef4271f0a01fedb74))


### Bug Fixes

* additional url fixes ([4b2763c](https://github.com/unraid/api/commit/4b2763c7f9d8b85d5b0ce066dfc9a9a80a115658))
* **api:** redirect benign pnpm postinstall warning to log file ([#1290](https://github.com/unraid/api/issues/1290)) ([7fb7849](https://github.com/unraid/api/commit/7fb78494cb23630f60a889e6252fc06754e14ef9))
* **deps:** update dependency chalk to v5 ([#1296](https://github.com/unraid/api/issues/1296)) ([6bed638](https://github.com/unraid/api/commit/6bed63805ff026be98a8e20c4d8a37cd47048357))
* **deps:** update dependency diff to v7 ([#1297](https://github.com/unraid/api/issues/1297)) ([3c6683c](https://github.com/unraid/api/commit/3c6683c81422a088c13e9545aaecececd78b8628))
* disable all config watchers ([#1306](https://github.com/unraid/api/issues/1306)) ([5c1b435](https://github.com/unraid/api/commit/5c1b4352cf71d8525f667822f8ca202e2934f463))
* extract callbacks to library ([#1280](https://github.com/unraid/api/issues/1280)) ([2266139](https://github.com/unraid/api/commit/226613974258f15d39932de94316a54aec2e29d2))
* OEM plugin issues ([#1288](https://github.com/unraid/api/issues/1288)) ([d5a3d0d](https://github.com/unraid/api/commit/d5a3d0dfac214fc433c2c0aec578de564a990dd4))
* replace files lost during pruning ([d0d2ff6](https://github.com/unraid/api/commit/d0d2ff65ed2d51223414e50bb1c2ecf82e32a071))

## [4.4.1](https://github.com/unraid/api/compare/v4.4.0...v4.4.1) (2025-03-26)


### Bug Fixes

* .env.production from allowing console logs on build ([#1273](https://github.com/unraid/api/issues/1273)) ([32acc2d](https://github.com/unraid/api/commit/32acc2d27c8bb565b38a66d8233030de3711ea12))
* patch version override logic incorrect ([#1275](https://github.com/unraid/api/issues/1275)) ([6a59756](https://github.com/unraid/api/commit/6a597561a3e21c27fff8d4530cf59cf382eaa015))

## [4.4.0](https://github.com/unraid/api/compare/v4.3.1...v4.4.0) (2025-03-25)


### Features

* add ReplaceKey functionality to plugin ([#1264](https://github.com/unraid/api/issues/1264)) ([4aadcef](https://github.com/unraid/api/commit/4aadcef1ca6b45b44885f2d2a986874e86945d4f))
* downgrade page replace key check ([#1263](https://github.com/unraid/api/issues/1263)) ([8d56d12](https://github.com/unraid/api/commit/8d56d12f67d86d7015a358727bcb303eb511ac42))
* make log viewer component dynamic ([#1242](https://github.com/unraid/api/issues/1242)) ([e6ec110](https://github.com/unraid/api/commit/e6ec110fbf81b329b72ef350643bf3c76734290a))
* ReplaceKey functionality in Registration and Update pages ([#1246](https://github.com/unraid/api/issues/1246)) ([04307c9](https://github.com/unraid/api/commit/04307c977cfd4916753140e5a20811c561d2dfb2))
* UnraidCheckExec for Check OS Updates via UPC dropdown ([#1265](https://github.com/unraid/api/issues/1265)) ([5935a3b](https://github.com/unraid/api/commit/5935a3b3c2f69ee683146c3fcc798d72996633f8))


### Bug Fixes

* **deps:** update all non-major dependencies ([#1236](https://github.com/unraid/api/issues/1236)) ([7194f85](https://github.com/unraid/api/commit/7194f859ce0178116621b4bdf28db553b037940d))
* **deps:** update all non-major dependencies ([#1247](https://github.com/unraid/api/issues/1247)) ([20b0aeb](https://github.com/unraid/api/commit/20b0aeb9d7e621ec917c928135b2c867e07ce7a4))
* **deps:** update all non-major dependencies ([#1251](https://github.com/unraid/api/issues/1251)) ([33a1a1d](https://github.com/unraid/api/commit/33a1a1ddd2f228cf001bb492f9c76bb5bc6dc8a0))
* **deps:** update all non-major dependencies ([#1253](https://github.com/unraid/api/issues/1253)) ([53fec0e](https://github.com/unraid/api/commit/53fec0efaba8f3e2dcf5f2899e3099e0e12f5162))
* **deps:** update dependency @nestjs/passport to v11 ([#1244](https://github.com/unraid/api/issues/1244)) ([edc93a9](https://github.com/unraid/api/commit/edc93a921ea93d98b7c2de9a7fed2fed650365e8))
* **deps:** update dependency graphql-subscriptions to v3 ([#1209](https://github.com/unraid/api/issues/1209)) ([c14c85f](https://github.com/unraid/api/commit/c14c85fcf7ce920edd75d15fa9b3d556f452bb88))
* **deps:** update dependency ini to v5 ([#1217](https://github.com/unraid/api/issues/1217)) ([f27660f](https://github.com/unraid/api/commit/f27660f140acb647cab1dce162af0d49d5655fb6))
* **deps:** update dependency jose to v6 ([#1248](https://github.com/unraid/api/issues/1248)) ([42e3d59](https://github.com/unraid/api/commit/42e3d59107dd800351ee1f7d175c550465ebddb4))
* **deps:** update dependency marked to v15 ([#1249](https://github.com/unraid/api/issues/1249)) ([2b6693f](https://github.com/unraid/api/commit/2b6693f404a9a3405300637d2c55bd5b65c61f0b))
* **deps:** update dependency pino-pretty to v13 ([#1250](https://github.com/unraid/api/issues/1250)) ([85fb910](https://github.com/unraid/api/commit/85fb91059a0ad7728d766cd3b429857b3fd4bd08))
* **deps:** update dependency pm2 to v6 ([#1258](https://github.com/unraid/api/issues/1258)) ([04ad2bc](https://github.com/unraid/api/commit/04ad2bc9c8c1e5fd9622655ce9881bde17388246))
* **deps:** update dependency shadcn-vue to v1 ([#1259](https://github.com/unraid/api/issues/1259)) ([1a4fe8f](https://github.com/unraid/api/commit/1a4fe8f85f50cf34df6af2c0bf55efc305fa9fff))
* **deps:** update dependency vue-i18n to v11 ([#1261](https://github.com/unraid/api/issues/1261)) ([0063286](https://github.com/unraid/api/commit/0063286e29b9a7439e6acc64973a3152370c75c3))
* **deps:** update vueuse monorepo to v13 (major) ([#1262](https://github.com/unraid/api/issues/1262)) ([94caae3](https://github.com/unraid/api/commit/94caae3d87fbfb04dfe5633030e24acddbcc0f6b))
* make scripts executable when building the plugin ([#1255](https://github.com/unraid/api/issues/1255)) ([e237f38](https://github.com/unraid/api/commit/e237f38bc4646f13461938c03d566fef781ad406))
* node installation not persisting across reboots ([#1256](https://github.com/unraid/api/issues/1256)) ([0415cf1](https://github.com/unraid/api/commit/0415cf1252ed8c7fba32a65c031dc0d21e0f5a81))
* update configValid state to ineligible in var.ini and adjust rel… ([#1268](https://github.com/unraid/api/issues/1268)) ([ef8c954](https://github.com/unraid/api/commit/ef8c9548baef99010e2f26288af33a90167e5177))

## [4.3.1](https://github.com/unraid/api/compare/v4.3.0...v4.3.1) (2025-03-18)


### Bug Fixes

* stepper fixes ([#1240](https://github.com/unraid/api/issues/1240)) ([e7f6f5e](https://github.com/unraid/api/commit/e7f6f5e8315c50fd37193f7d7de2af3d370c18ea))

## [4.3.0](https://github.com/unraid/api/compare/v4.2.1...v4.3.0) (2025-03-18)


### Features

* update production release flow to validate less strictly ([#1238](https://github.com/unraid/api/issues/1238)) ([3afb203](https://github.com/unraid/api/commit/3afb203b856655e4ce7c9d709e30d3f2ebd64784))

## [4.2.1](https://github.com/unraid/api/compare/v4.2.0...v4.2.1) (2025-03-18)


### Bug Fixes

* **deps:** update all non-major dependencies ([#1192](https://github.com/unraid/api/issues/1192)) ([65b8db2](https://github.com/unraid/api/commit/65b8db2845a5f4234527a70b0625b1a88df5b2fe))

## [4.2.0](https://github.com/unraid/api/compare/v4.1.3...v4.2.0) (2025-03-18)


### Features

* add resolver for logging ([#1222](https://github.com/unraid/api/issues/1222)) ([2d90408](https://github.com/unraid/api/commit/2d9040801f044dc7a974e9737acdffbbdcae5e37))
* connect settings web component ([#1211](https://github.com/unraid/api/issues/1211)) ([653de00](https://github.com/unraid/api/commit/653de00d3761826c8f0a969be3cfb9253f2d3e43))
* improve local dev with install path ([#1221](https://github.com/unraid/api/issues/1221)) ([32c5b0a](https://github.com/unraid/api/commit/32c5b0a879e59a823d5dc7bf4b4b4e9d07d2f010))
* split plugin builds ([4d10966](https://github.com/unraid/api/commit/4d109669dba614328db068697d97d3ad424a6237))
* swap to absolute paths for css ([#1224](https://github.com/unraid/api/issues/1224)) ([6f9fa10](https://github.com/unraid/api/commit/6f9fa10c0909874a5964818f24ed28b79463aed2))
* update theme application logic and color picker ([#1181](https://github.com/unraid/api/issues/1181)) ([c352f49](https://github.com/unraid/api/commit/c352f4961885e16260d95b0c8be938009bcfc5e4))
* use patch version if needed on update check ([#1227](https://github.com/unraid/api/issues/1227)) ([6ed46b3](https://github.com/unraid/api/commit/6ed46b3b61432c51a58c741ead014c856671d839))


### Bug Fixes

* add INELIGIBLE state to ConfigErrorState enum ([#1220](https://github.com/unraid/api/issues/1220)) ([1f00212](https://github.com/unraid/api/commit/1f00212a7e663f29cbdeabf5663c9f398799b761))
* **api:** dynamix notifications dir during development ([#1216](https://github.com/unraid/api/issues/1216)) ([0a382ca](https://github.com/unraid/api/commit/0a382ca5b77ad6e7d5e5c6f35b11ac2dd2479d30))
* **api:** type imports from generated graphql types ([#1215](https://github.com/unraid/api/issues/1215)) ([fd02297](https://github.com/unraid/api/commit/fd02297971d88ac420887969313fbca570ffdc6d))
* **deps:** update dependency @nestjs/schedule to v5 ([#1197](https://github.com/unraid/api/issues/1197)) ([b1ff6e5](https://github.com/unraid/api/commit/b1ff6e553ed1391e8f450446088502fd6b9782c0))
* **deps:** update dependency @vueuse/core to v12 ([#1199](https://github.com/unraid/api/issues/1199)) ([d8b8339](https://github.com/unraid/api/commit/d8b8339d6c8cdebd468160fb17c4056ad5dffd4c))
* fix changelog thing again ([2426345](https://github.com/unraid/api/commit/24263459fc35d61065712d315a03fd425d98d328))
* fix invalid path to node with sh execution ([#1213](https://github.com/unraid/api/issues/1213)) ([d12448d](https://github.com/unraid/api/commit/d12448d75a6637fe1608e3e3807ecfd2a20f55c9))
* load tag correctly ([acd692b](https://github.com/unraid/api/commit/acd692b717b91d708fa93a2941ac4ee9ad544ac4))
* log errors ([629feda](https://github.com/unraid/api/commit/629feda5b8befd1677d38999a08c667717491442))
* one-command dev & web env files ([#1214](https://github.com/unraid/api/issues/1214)) ([8218fab](https://github.com/unraid/api/commit/8218fab98b53394171a4cc207432de01e95250ae))
* re-release fixed ([bb526b5](https://github.com/unraid/api/commit/bb526b5444ac6aaa832adee723513b98df4de423))
* recreate watcher on path change ([#1203](https://github.com/unraid/api/issues/1203)) ([5a9154e](https://github.com/unraid/api/commit/5a9154ebeadfbc6439e7aac6cf9fd2464acff6d0))
* update brand loading variants for consistent sizing ([#1223](https://github.com/unraid/api/issues/1223)) ([d7a4b98](https://github.com/unraid/api/commit/d7a4b9855f182588fded088bf9c5610b2f9967b7))

## [4.1.3](https://github.com/unraid/api/compare/v4.1.2...v4.1.3) (2025-02-21)


### Bug Fixes

* chown correctly ([#1185](https://github.com/unraid/api/issues/1185)) ([11b0441](https://github.com/unraid/api/commit/11b04417371ba77eddc12699db8575988d6deafc))
* create releases as drafts ([0adba3a](https://github.com/unraid/api/commit/0adba3ae3566ad84626a9ab1cf7d38edb24de69f))
* **deps:** update all non-major dependencies ([#1168](https://github.com/unraid/api/issues/1168)) ([443b608](https://github.com/unraid/api/commit/443b608163cdb64775d6758b8207cbe745f892f4))
* revert config ([c17db6d](https://github.com/unraid/api/commit/c17db6d7648c15f71cd2195530cd0c2d051db3f6))
* small modal window ([#1183](https://github.com/unraid/api/issues/1183)) ([2183965](https://github.com/unraid/api/commit/2183965757ded27a5a01a6e27c4b783c9434af2e))

## [4.1.2](https://github.com/unraid/api/compare/v4.1.2...v4.1.2) (2025-02-21)


### Features

* add api key creation logic ([81382bc](https://github.com/unraid/api/commit/81382bcf1d26364ad9c5445530f648209101cf91))
* add category.json ([c9e87e2](https://github.com/unraid/api/commit/c9e87e2e5b47a8801b7865ed586c803d0b470915))
* add command to package.json scripts ([0dfb07f](https://github.com/unraid/api/commit/0dfb07f9eb519e60441f4123423f65acfdffca3b))
* add csrf support to api & web components ([#999](https://github.com/unraid/api/issues/999)) ([19241ed](https://github.com/unraid/api/commit/19241ed55f5112f878b9890d8695badf7eb1c3eb))
* add description flag, remove console log, and update readme ([c416c30](https://github.com/unraid/api/commit/c416c30951de4ed6b8d7a8c014403772db1c2015))
* add developer docs ([#1128](https://github.com/unraid/api/issues/1128)) ([bb2e340](https://github.com/unraid/api/commit/bb2e340b68268d5121db650b27e8b2580c7966bb))
* add line about recommendation for sso command ([44727a8](https://github.com/unraid/api/commit/44727a8d1a7c16c566678da43119b17a6303e375))
* add log rotation ([f5c7ad9](https://github.com/unraid/api/commit/f5c7ad9221f80e4630e69f78d57f08f4c7252719))
* add logging around fixture downloads ([a1ce27b](https://github.com/unraid/api/commit/a1ce27b17c970657f52635600f0d13116523f928))
* add logrotate cron again ([4f85f66](https://github.com/unraid/api/commit/4f85f6687f920dae50277e726e2db2c3d946e867))
* add patch for auth-request.php ([ec6ec56](https://github.com/unraid/api/commit/ec6ec562f43aac9947de2e9c269181303f42b2db))
* add user with cli ([37458cd](https://github.com/unraid/api/commit/37458cd7408a1ad8aedca66a55ff13ac19ee30db))
* address log level feedback ([49774aa](https://github.com/unraid/api/commit/49774aae459797f04ef2866ca064050aa476ae91))
* allow csrf passing through querystring ([dba38c0](https://github.com/unraid/api/commit/dba38c0d149a77e4104c718c53d426330a17f2fa))
* allow deletion and creation of files with patches ([32c9524](https://github.com/unraid/api/commit/32c952402c25e8340b1c628b4d0fdc4816b28ade))
* always ensureDirectory for keys exists ([c6e9f80](https://github.com/unraid/api/commit/c6e9f804c58e44b46bce9f0da2260888544354cd))
* **api:** graphql sandbox on unraid servers ([#1047](https://github.com/unraid/api/issues/1047)) ([ec504f3](https://github.com/unraid/api/commit/ec504f39297c92b64d9d3cc2f8f482cc1f3a2e44))
* **api:** omit tz from sys time date format by default ([b2acde3](https://github.com/unraid/api/commit/b2acde3351d7afe18a2902e90b672537aadabffd))
* **api:** rm 2fa & t2fa from myservers config type ([#996](https://github.com/unraid/api/issues/996)) ([89e791a](https://github.com/unraid/api/commit/89e791ad2e6f0395bee05e3f8bdcb2c8d72305dd))
* async disk mapping ([bbb27e6](https://github.com/unraid/api/commit/bbb27e686897e4f9a0c926553d75aa046d7a8323))
* async hypervisor and FIXED vm listing ([e79f4dd](https://github.com/unraid/api/commit/e79f4ddbc7061c249efb8214a311bb629628f669))
* auto-docusaurus-prs ([#1127](https://github.com/unraid/api/issues/1127)) ([1147e76](https://github.com/unraid/api/commit/1147e762ae2fed6dea198fa38d6bcc514a1e66fb))
* begin building plugin with node instead of bash ([#1120](https://github.com/unraid/api/issues/1120)) ([253b65a](https://github.com/unraid/api/commit/253b65a85ab9c5f53d53ef265b41aa132678f278))
* better patch application ([a3e7daa](https://github.com/unraid/api/commit/a3e7daa6a6565ac81004ffd13da35d8b95b429cf))
* better pm2 calls, log lines ([338ce30](https://github.com/unraid/api/commit/338ce3061310dfc42ad5f65edacbe5272de4afc7))
* cleanup config entries ([943e73f](https://github.com/unraid/api/commit/943e73fa696b6ecec3227be914ab4962c4fee79d))
* cleanup disclaimer and command to add users ([6be3af8](https://github.com/unraid/api/commit/6be3af8d7569d9c413dd9349df52e3fa4cb4f631))
* cli Commands ([f8e5367](https://github.com/unraid/api/commit/f8e5367f3eb47daa5bcbd7711ae5835369502a1d))
* CLI options for adding and deleting users ([16bf6d4](https://github.com/unraid/api/commit/16bf6d4c27ae8fa8d6d05ec4b28ce49a12673278))
* coderabbit suggestion ([11ac36c](https://github.com/unraid/api/commit/11ac36c3616a90853d91467526fd39ecba17db88))
* configure PM2 on startup ([2b908f1](https://github.com/unraid/api/commit/2b908f100b9eefaccf2264d5ff9945667568acf0))
* convert to pnpm monorepo ([#1137](https://github.com/unraid/api/issues/1137)) ([8d89f8b](https://github.com/unraid/api/commit/8d89f8b20d6f3983d4e85b33827a857aa862db37))
* create key cli command logic and add to index command list ([9b2a62d](https://github.com/unraid/api/commit/9b2a62d642b0942e3787e4ddd582a66e40321ab2))
* csv validation ([84aae15](https://github.com/unraid/api/commit/84aae15a73014592c226fa3701e34e57c7b60b46))
* default value for option ([6513fc4](https://github.com/unraid/api/commit/6513fc49de61c836e1aabf32a874d7da7da18adb))
* disable casbin logging ([2518e7c](https://github.com/unraid/api/commit/2518e7c506f0d3aa9f44031d61dce95d9db0a4cf))
* docstrings ([b836ba7](https://github.com/unraid/api/commit/b836ba72516c554ee8973d69aaaa4ed35b465fa7))
* dont pass entire server state for privacy ([54e3f17](https://github.com/unraid/api/commit/54e3f17bd9e541f50970c696bbe8b602ec38a748))
* download fixtures from the web ([1258c2b](https://github.com/unraid/api/commit/1258c2bc1813f0fa3cd52b4932302ad12b4edd01))
* enable sandbox in dev mode ([4536d70](https://github.com/unraid/api/commit/4536d7092d77c68f5a996fd63bf74ce6e64f5efe))
* enable sandbox with developer command ([c354d48](https://github.com/unraid/api/commit/c354d482283295547afeb99c5e110b0181197c44))
* enable token sign in with comma separated subs in myservers.config ([ebed5bd](https://github.com/unraid/api/commit/ebed5bddea1445d9aaaee60d54758dc74b77271e))
* exit cli after running command ([04bf528](https://github.com/unraid/api/commit/04bf528616fcbdf916916734a12d5fd32db9a06d))
* extensive file checking ([ab881c8](https://github.com/unraid/api/commit/ab881c8aed8dd4aa9fd71c32b50d3514d1496fa5))
* fallback to local ([a2579c2](https://github.com/unraid/api/commit/a2579c2a7f80f54b4cc61533aec9ecc41a7e7f54))
* faster failure logic ([b439434](https://github.com/unraid/api/commit/b439434f1574e174fcf23f3a5f5b8df8e092eb1e))
* fix docusaurus build + update snapshot ([23b27bd](https://github.com/unraid/api/commit/23b27bd63ea99f4137538eab40501daa67d7e3f5))
* force linting on build ([43e6639](https://github.com/unraid/api/commit/43e663998a55e83c142067cb64ae7a331395fe68))
* generate key one time ([afe53c3](https://github.com/unraid/api/commit/afe53c30ea9987e6d8728faa2cb7291f8a126ecb))
* glob for files ([3fe281f](https://github.com/unraid/api/commit/3fe281f1ae28e3cbc089b5244a6ae2863b20adcb))
* hypervisor async imports ([32686ca](https://github.com/unraid/api/commit/32686ca4f0c25c43c6a9f7162bb8179b39e58f7e))
* ignore generated code ([68265a2](https://github.com/unraid/api/commit/68265a26efa588b60001310b9a11b398f04ae88f))
* improve packing ([9ef02d5](https://github.com/unraid/api/commit/9ef02d53666b70d41fdd186364808deac715e1ff))
* initial patcher implementation using the diff tool ([c87acbb](https://github.com/unraid/api/commit/c87acbb146c2e4e30997c964cd8be325dee68cea))
* initial setup of permissions on keys ([#1068](https://github.com/unraid/api/issues/1068)) ([cf0fa85](https://github.com/unraid/api/commit/cf0fa850954ea2f018e338a132149f872b966df4))
* initial version of modification service ([b80469d](https://github.com/unraid/api/commit/b80469d38e519a7ba0e6eae636cda2a821e2d465))
* inject after form ([a4b276f](https://github.com/unraid/api/commit/a4b276f7874580bbf9827025730777715c9983da))
* kill timeout extended ([22d4026](https://github.com/unraid/api/commit/22d40264a02672a818053b5280d63a03ff7336b9))
* log size and only tar files ([731f2f8](https://github.com/unraid/api/commit/731f2f8e77a77b544a7f526c78aabfacca71eee4))
* logrotate test ([4504c39](https://github.com/unraid/api/commit/4504c39a2bbcf51385578b69a9fdc7b81a950e98))
* manually install libvirt in build process to ensure it is included in the final build ([e695481](https://github.com/unraid/api/commit/e695481363f0d5d7add9d0e0d50d1e113b3024f6))
* more pm2 fixes ([8257bdf](https://github.com/unraid/api/commit/8257bdff3624211ee645349abdec303bf271538e))
* move fixtures into __test__ folder ([22a901d](https://github.com/unraid/api/commit/22a901de9b0c274d3f75ed4b4618cd6cd90324ba))
* myservers_fb keepalive location ([e07e7f3](https://github.com/unraid/api/commit/e07e7f335c8ea4a73966ada90c26b7c82dbb025e))
* only write config when a specific config update action occurs ([ec29778](https://github.com/unraid/api/commit/ec29778e37a50f43eb164991bcf2a6ff9c266033))
* properly read log level from environment ([b5151e9](https://github.com/unraid/api/commit/b5151e9ba76a6814e24e8da34e8a3c1bf1cc2144))
* public index ([f0641ea](https://github.com/unraid/api/commit/f0641ea7ca0919884dc3b8642c2e6694398e3246))
* remove sso if disabled on Unraid-API start ([3bc407c](https://github.com/unraid/api/commit/3bc407c54e8e7aeadebd9ac223d71f21ef97fca1))
* remove sso user command ([bbd809b](https://github.com/unraid/api/commit/bbd809b83826e81eef38a06e66f3393e4f83e81e))
* remove sso user options ([e34041f](https://github.com/unraid/api/commit/e34041f86ef7ab6cf5e2fdf7efb86458d190edc1))
* remove unused config sections ([f0b9c4f](https://github.com/unraid/api/commit/f0b9c4f44ab0ee8f75bf96fde2413988ef4f6a8c))
* remove unused fields ([d2d0f7c](https://github.com/unraid/api/commit/d2d0f7cd9acb53ea2372245d7ef669c7ca24ee8a))
* remove unused vars ([0507713](https://github.com/unraid/api/commit/0507713972e344ad47bd077554d5888269669e9c))
* rename api key resource back to api_key ([ee9666b](https://github.com/unraid/api/commit/ee9666b317d7feb5c15d53e2a6b902c7771c8c7a))
* rename modification file ([70a93f2](https://github.com/unraid/api/commit/70a93f2cc63e0e62242be6fe1a717515a6fbec85))
* reorder index ([858553f](https://github.com/unraid/api/commit/858553f0debb6424ae0614640b82a050c33f175a))
* restart the API when an SSO user is added ([a6b0c90](https://github.com/unraid/api/commit/a6b0c906a423df048401750943f02dfdc9bc2619))
* restoring sso error ([234bf7d](https://github.com/unraid/api/commit/234bf7dfa4b0be88b6cc13996d8f29ec819da26e))
* revert local api key value ([ff40e7a](https://github.com/unraid/api/commit/ff40e7ae392052d3d9e1b084c5f4851e8ebd529e))
* rollback if patch exists before applying ([c2f4e8d](https://github.com/unraid/api/commit/c2f4e8d4e5c758601bd20ba491fd077b434ba45e))
* secondary changes ([d75331a](https://github.com/unraid/api/commit/d75331a67e3566875ce8642fce80195e79932a4c))
* service tests for modifier service ([08c1502](https://github.com/unraid/api/commit/08c150259f2b4630d973803f4edff69c8bf0ec3a))
* session issues ([5981693](https://github.com/unraid/api/commit/5981693abd605337f9174ba4c85fd1bfc243edeb))
* shared call to createPatch ([eb3e263](https://github.com/unraid/api/commit/eb3e263fb32a748bfa06ec6d119ee51d242707cf))
* simplify docs ([d428030](https://github.com/unraid/api/commit/d428030b806f55b62421559d434fc723786b03ad))
* style improvements ([b0f395e](https://github.com/unraid/api/commit/b0f395ef76f11047eaa13091df277df0459e9d8f))
* swap to async exit hook ([4302f31](https://github.com/unraid/api/commit/4302f316820a109c76408092994727b2dc030a15))
* switch to nest-commander ([1ab2ab5](https://github.com/unraid/api/commit/1ab2ab5b58a1f49cd6b05aaa84bfeced49d68e8e))
* try catch restart ([89abee6](https://github.com/unraid/api/commit/89abee680bdbdaa9946ddb991f0e6b5ada9ccdf7))
* **ui:** webgui-compatible web component library ([#1075](https://github.com/unraid/api/issues/1075)) ([1c7b2e0](https://github.com/unraid/api/commit/1c7b2e091b0975438860a8e1fc3db5fd8d3fcf93))
* unnecessary comment ([0c52256](https://github.com/unraid/api/commit/0c5225612875b96319b28ef447db69ecab15cfda))
* unraid single sign on with account app ([5183104](https://github.com/unraid/api/commit/5183104b322a328eea3e4b2f6d86fd9d4b1c76e3))
* update packageManager field for pnpm ([8d5db7a](https://github.com/unraid/api/commit/8d5db7a9bfdf528e2d58b20cc62434ea5929d24f))
* upgrade dependencies ([0a0cac3](https://github.com/unraid/api/commit/0a0cac3da74c2fe20f7100a9ad5d1caafa74b157))
* use execa for start and stop ([46ab014](https://github.com/unraid/api/commit/46ab0144d41b425015487c251c1884744223ba29))
* use zod to parse config ([19cf1be](https://github.com/unraid/api/commit/19cf1be079f2ccb9e0cfa10f2fb97a18f15c5729))
* validate token format in both PHP and CLI ([6ef05a3](https://github.com/unraid/api/commit/6ef05a3d7770f799e7d587c2cef8d29f6058bee1))
* **web:** add delete all notifications button to archive view in notifications sidebar ([3bda9d6](https://github.com/unraid/api/commit/3bda9d6a4ca01cc5580012b0133e72929d6dab40))
* **web:** enhance notifications indicator in UPC ([#950](https://github.com/unraid/api/issues/950)) ([6376848](https://github.com/unraid/api/commit/63768486e4ec64ab32666a26adf96f4db4a53e81))
* **web:** pull date format from display/date and time settings ([b058067](https://github.com/unraid/api/commit/b058067b628ca7866a9ba0a6c4c5e4d5505d98cb))
* **web:** rm api-key validation from connect sign in ([#986](https://github.com/unraid/api/issues/986)) ([7b105d1](https://github.com/unraid/api/commit/7b105d18678e88a064f0643d6e857704789e0ee8))
* zod config no longer any ([c32c5f5](https://github.com/unraid/api/commit/c32c5f57127b9469bde8806d78dc364562e73d9f))


### Bug Fixes

* allow concurrent testing with a shared patcher instance ([623846e](https://github.com/unraid/api/commit/623846ef46eb24a32c62516de58e8bc5d0219833))
* **api:** append time to formatted date when a custom date format is selected ([0ac8ed9](https://github.com/unraid/api/commit/0ac8ed9d9e7e239e471eedf466832aed0270d123))
* **api:** change log output location for diagnostic compatibility ([#1130](https://github.com/unraid/api/issues/1130)) ([cba1551](https://github.com/unraid/api/commit/cba155138379d47bc3151c7c27d745ba6a345d83))
* **api:** delay pm2 start until server has booted ([bd3188e](https://github.com/unraid/api/commit/bd3188efea4d3656994ffae32bd53f821c96358d))
* **api:** exclude duplicates from legacy script in archive retrieval ([8644e13](https://github.com/unraid/api/commit/8644e130979ed8740c5a8da0b3984266e2b3684c))
* **api:** improve defaults in PM2 service ([#1116](https://github.com/unraid/api/issues/1116)) ([57526de](https://github.com/unraid/api/commit/57526dede69e3a6547d05183e43c5b36dd1cae89))
* **api:** logrotate modification & permissions ([#1145](https://github.com/unraid/api/issues/1145)) ([5209df2](https://github.com/unraid/api/commit/5209df2776e1a985e82bedc655fe28acf1fd0bde))
* **api:** make cookie recognition during websocket connection more ([353e012](https://github.com/unraid/api/commit/353e012db8ab5280863f32392c520b4a330c13cc))
* **api:** pm2 start script & limit auto restarts ([#1040](https://github.com/unraid/api/issues/1040)) ([ebcd347](https://github.com/unraid/api/commit/ebcd3479e735724626ffc6907c338d5080898bee))
* **api:** retry mothership connection up to 3x before logout ([#1069](https://github.com/unraid/api/issues/1069)) ([c27bb1b](https://github.com/unraid/api/commit/c27bb1be4c7a9ab201585586f3bc5e4afa1c7791))
* **api:** sanitize incoming user session id's ([f5e3424](https://github.com/unraid/api/commit/f5e3424b79702e8f959b5519e83370a9e1d2033b))
* **api:** slow init of unraid-api cli ([#1022](https://github.com/unraid/api/issues/1022)) ([5dbbae7](https://github.com/unraid/api/commit/5dbbae796792a62234497d056eac019aa084b21c))
* **api:** update deploy-dev script to dist instead of src ([55cce09](https://github.com/unraid/api/commit/55cce09e65521762a6fe388d5b9b88ace1337c26))
* **api:** validate cookie session data ([491f680](https://github.com/unraid/api/commit/491f680607ce7244d9e47a457e44cde711fbe00c))
* apply and rollback error handling ([e22191b](https://github.com/unraid/api/commit/e22191bc77bc09f5c6c4ad57e5073829cf966ba4))
* authorization type error ([#987](https://github.com/unraid/api/issues/987)) ([7a4799e](https://github.com/unraid/api/commit/7a4799e9cd4caef6acfc3661d205a377fcf499ab))
* back to default configs ([b5711c9](https://github.com/unraid/api/commit/b5711c91284072991bcf409ac6126cd4b46afc7c))
* backup restore formatting ([15210f6](https://github.com/unraid/api/commit/15210f64b0938ec884a3ef4379d245c661eab9a3))
* basic test fixed ([2f38035](https://github.com/unraid/api/commit/2f38035520ca0fe796c981d08b9136d89ffc5888))
* better js file handling ([ddf160e](https://github.com/unraid/api/commit/ddf160e878a352842e813154b607945ccc7b4081))
* better loader functionality and error handling ([8a57d2d](https://github.com/unraid/api/commit/8a57d2dccbcb9c2effc5df5d8c69ad02713de24a))
* cleaner logs for starting API ([79f26ef](https://github.com/unraid/api/commit/79f26ef251cb42e7f2106d00c6c05e2bf17b8227))
* clearer error messaging ([e373849](https://github.com/unraid/api/commit/e37384966c5b9079bb507052dcaba56232c1c42a))
* code review feedback ([c66079e](https://github.com/unraid/api/commit/c66079e9a8e0ef47e5054118d0581bec708ac604))
* completion script registration ([05c8c9b](https://github.com/unraid/api/commit/05c8c9bf078ece2061ad8ae32497f52b8c9b94dc))
* connect key role ([2dcfc1c](https://github.com/unraid/api/commit/2dcfc1c19a1d085df84f0b1b50c096e3220205dd))
* create api key for connect on startup ([58329bc](https://github.com/unraid/api/commit/58329bc29521ebc26b27ee20013ac3926c5088c2))
* create api key permissions ([cefb644](https://github.com/unraid/api/commit/cefb644bd7fa513f553ca0ca4c49f0fb42a74112))
* create connect key ([6b1ab7b](https://github.com/unraid/api/commit/6b1ab7b74ae1d2938fa9105180a5f66e9604fd41))
* cwd on ecosystem.config.json ([dfd0da4](https://github.com/unraid/api/commit/dfd0da4ca23078f6de2e54d5e5bd6cba06334abc))
* default overwrite false test ([cf59107](https://github.com/unraid/api/commit/cf59107e568d91be684176335db5300bee9be865))
* delete .original files ([a9eb21a](https://github.com/unraid/api/commit/a9eb21aac0f373990aaa3f7a99731612540533cf))
* deprecated  version warning ([89d0bd2](https://github.com/unraid/api/commit/89d0bd2e6da35fb1e8d95627d38edb54f82e0c6b))
* **deps:** update all non-major dependencies ([#1158](https://github.com/unraid/api/issues/1158)) ([45ebc8b](https://github.com/unraid/api/commit/45ebc8b6e07c53ad3eee28d5cf8ac9cd0d827754))
* **deps:** update apollo graphql packages ([7b1ee99](https://github.com/unraid/api/commit/7b1ee9940cca46e563bb79c7056996315f9decc5))
* **deps:** update dependency @apollo/client to v3.12.6 ([bb7800a](https://github.com/unraid/api/commit/bb7800a8c088705fd8310671a9896cbe9b0184e5))
* **deps:** update dependency @apollo/client to v3.12.9 ([6607cf2](https://github.com/unraid/api/commit/6607cf20c10a091d466c6a8031eebc17feb3e3fc))
* **deps:** update dependency @graphql-tools/load-files to v7.0.1 ([4e5c724](https://github.com/unraid/api/commit/4e5c7242e43cc356f1c69adcfcd25b57896af476))
* **deps:** update dependency @nestjs/schedule to v4.1.2 ([faf0de5](https://github.com/unraid/api/commit/faf0de5a19256efb83dc45a484e3cba65596ccd7))
* **deps:** update dependency chokidar to v4.0.3 ([d63a93c](https://github.com/unraid/api/commit/d63a93c55004d17b6d17634c55ffbc5670ebbec7))
* **deps:** update dependency dockerode to v4 ([#830](https://github.com/unraid/api/issues/830)) ([c331ecd](https://github.com/unraid/api/commit/c331ecd50c4910fd6c35e5ad92b3f676d552febc))
* **deps:** update dependency dotenv to v16.4.7 ([c66a650](https://github.com/unraid/api/commit/c66a6502b027853046d126a14ddee870ffabd10c))
* **deps:** update dependency execa to v9.5.2 ([d487c90](https://github.com/unraid/api/commit/d487c90ccc20162c76f0cdf49a736c1fee4271bd))
* **deps:** update dependency express to v4.21.2 ([a070306](https://github.com/unraid/api/commit/a07030684c8777e47eb4a51be0ea680b7f217e74))
* **deps:** update dependency got to v14.4.5 ([975a47c](https://github.com/unraid/api/commit/975a47c7d47841c49443f46264feb54abf53698c))
* **deps:** update dependency graphql-ws to v5.16.2 ([25d8f08](https://github.com/unraid/api/commit/25d8f085b67c2e53876d837c739214dc874116b8))
* **deps:** update dependency ini to v4.1.3 ([4c88cbe](https://github.com/unraid/api/commit/4c88cbee4b2d5f6717241dadac23bfe90ce15193))
* **deps:** update dependency node-window-polyfill to v1.0.4 ([8bfa88f](https://github.com/unraid/api/commit/8bfa88f4bc932eb82dd9b33a494811ea15764758))
* **deps:** update dependency openid-client to v6.1.7 ([0f50517](https://github.com/unraid/api/commit/0f50517a8544e1eb9b08ad1b3f05f798491b7f23))
* **deps:** update dependency p-retry to v6.2.1 ([c6f3241](https://github.com/unraid/api/commit/c6f324155019e066701723a57b642c6e3ba8332d))
* **deps:** update dependency pm2 to v5.4.3 ([a754090](https://github.com/unraid/api/commit/a75409026dd4e3d9ed120802012b67b179327448))
* **deps:** update dependency uuid to v11.0.5 ([7e3398b](https://github.com/unraid/api/commit/7e3398b2efabf1a5407d6e20c165eb4923b3bab2))
* **deps:** update graphql-tools monorepo ([cd7e2fe](https://github.com/unraid/api/commit/cd7e2feea199276a1d431cf355e54e12e5960d9a))
* **deps:** update graphqlcodegenerator monorepo ([0446c59](https://github.com/unraid/api/commit/0446c5924a6a9dd15b875628ca0f1197cfe521c4))
* **deps:** update graphqlcodegenerator monorepo ([15c789d](https://github.com/unraid/api/commit/15c789dbb34b85bed55c2731fb8ae8260f5f311f))
* **deps:** update nest monorepo to v10.4.15 ([07b1ea9](https://github.com/unraid/api/commit/07b1ea9a10634a597909ae1d237cc3b1e7f959b7))
* **deps:** update nest-graphql monorepo to v12.2.2 ([91aabd9](https://github.com/unraid/api/commit/91aabd9ffbfb8c2ceb4110217dfc05de8859077d))
* do not process.exit on restart or stop command ([933575f](https://github.com/unraid/api/commit/933575fc2badbb09b3a9d3c66724e37a9ee246f2))
* don't check code for execa ([508a5eb](https://github.com/unraid/api/commit/508a5eb49d9514dca9953317d9fa93314fe63e4c))
* dont remove login file without a backup presetn ([0370e4f](https://github.com/unraid/api/commit/0370e4f7ea3e3df0d2264264324d8e53ffc0c086))
* ensure directory exists before making connect key ([9e27ec9](https://github.com/unraid/api/commit/9e27ec98b68a49bdd6dc4b03de8c0cc3a1470a5e))
* excess spacing in api-key.service ([1deb002](https://github.com/unraid/api/commit/1deb0023287a39d40e52e89c515a28e62352f62c))
* extra log line ([1183063](https://github.com/unraid/api/commit/1183063aa7063afd8222def18f5e1fd6077e8c88))
* extra spacing in config.ts ([f3ee7be](https://github.com/unraid/api/commit/f3ee7be80f2c60266fbb13597a70f0a389fb577f))
* file modification service fixes ([aa5b3f4](https://github.com/unraid/api/commit/aa5b3f4e47ed88df23af00dfcccb7b64786b6231))
* find by key, not ID ([3c3fa1e](https://github.com/unraid/api/commit/3c3fa1e27cfabbe6926c3da8870751397eed1def))
* fix libvirt bindings ([#1167](https://github.com/unraid/api/issues/1167)) ([5817e5d](https://github.com/unraid/api/commit/5817e5d4b1697bbdfaa1984ccd650a232233cc15))
* forced restarting on commands ([925866d](https://github.com/unraid/api/commit/925866d389e337fcb8c249ead929e1f65854465b))
* format authrequest mod as other files ([180a81d](https://github.com/unraid/api/commit/180a81dbae8e749eae237fc8cee2950c790eedf0))
* formatting issue ([42ca969](https://github.com/unraid/api/commit/42ca9691f7547a4340501863c1882efc0aee4c60))
* initial feedback about report addressed ([5dee09c](https://github.com/unraid/api/commit/5dee09c77ad375de2eca59f650e5fea2070087b5))
* install as-integrations/fastify ([ff4546d](https://github.com/unraid/api/commit/ff4546d6692d2a4799f2dbeef0d5e5c6bac62561))
* length ([83579f1](https://github.com/unraid/api/commit/83579f1fbd03ffe929d009c20d214b4de62835c6))
* lint ([0f218b8](https://github.com/unraid/api/commit/0f218b8b72e397734823efab8f2141973a3a80ce))
* lint ([82bca54](https://github.com/unraid/api/commit/82bca54c594265ddf23a298691bd7ef6d4b47f32))
* lint ([ceb443d](https://github.com/unraid/api/commit/ceb443da15d177a950c36af61b93a7126cf4ca85))
* lint ([da04e7c](https://github.com/unraid/api/commit/da04e7ce0873d7802a936952d91e9867f0868a6e))
* lint ([7d87f0e](https://github.com/unraid/api/commit/7d87f0eee23dfa0f391fd342d38ed9084f18d8d4))
* logrotate error ([8c64dd2](https://github.com/unraid/api/commit/8c64dd2f2c65aa83ce0e2d501357ee595c976e56))
* mock ensureDirSync ([7e012e6](https://github.com/unraid/api/commit/7e012e6a2eb96ccddf5a1f69d7580b4bdfe7a0a9))
* more generic test ([0f651db](https://github.com/unraid/api/commit/0f651dbf61a1822b492aa80030f0bc231bc6f606))
* only instantiate service one time ([933dc81](https://github.com/unraid/api/commit/933dc81b6c50db5a33f586f7094e1ea524b9a9fa))
* only toast unread notifications, not archived ones ([cc59be6](https://github.com/unraid/api/commit/cc59be6cb3efc71226ee50f9f04e37a2e4b50de6))
* padding and glob function issues ([1d3f2eb](https://github.com/unraid/api/commit/1d3f2eb8213115c3385ac2d29ee8f53560347ba8))
* patch-utils unused ([047808d](https://github.com/unraid/api/commit/047808dce0cd9e9b4b273a9124dbd45ca9446208))
* paths now correct, better download logic ([16db2d9](https://github.com/unraid/api/commit/16db2d908dcb2c65508b367712c51bf9872a95e5))
* properly log error with template string ([3781f1f](https://github.com/unraid/api/commit/3781f1f41c7f0eef604daee0402ed9a2bb27cd46))
* pull token from query not params ([2e827e7](https://github.com/unraid/api/commit/2e827e7cabe4a6a069d4e8779015e5896d8a1d1d))
* remove devDependencies from output package json ([294869b](https://github.com/unraid/api/commit/294869bbea7f8a1863f8aafae6b074330e057679))
* remove isNaN in favor of number.isNaN ([03e3a46](https://github.com/unraid/api/commit/03e3a46092db613281176b88cae284f6448027c6))
* remove memory key generation ([b84db13](https://github.com/unraid/api/commit/b84db1322104c7f26f7b6378f25a2757b3010c6d))
* remove unused constructor ([e0e2a7b](https://github.com/unraid/api/commit/e0e2a7b41c5e599ed4cf3bf49c7faea3b71f0b70))
* remove usage of Role.UPC ([d1e2f6e](https://github.com/unraid/api/commit/d1e2f6e0b391cb4eca75a0997b41cb99a9953d42))
* report issues + pm2 issues ([28c383e](https://github.com/unraid/api/commit/28c383e1d111d4ac4226d7d966533ba80ca5d9a1))
* reset config to be closer to default ([b7fbb0b](https://github.com/unraid/api/commit/b7fbb0b6af0453f5f6a17087bb7e68c393b9fe3f))
* resource busy when removing all subdirectories ([29936c9](https://github.com/unraid/api/commit/29936c90938fb83bc2f154315ca63a9d7cc98552))
* restart command elegant ([296117b](https://github.com/unraid/api/commit/296117b51aac8a4c15366f2271af858868b6e071))
* revert changelog ([e9d47ca](https://github.com/unraid/api/commit/e9d47caf181148317e5ba8f0d11a433b09add0e3))
* revert dockerode upgrade ([#1140](https://github.com/unraid/api/issues/1140)) ([a74a379](https://github.com/unraid/api/commit/a74a379a93fd15a315e31191de1bf69c5879f8a6))
* revert myservers.cfg ([d0896f3](https://github.com/unraid/api/commit/d0896f3ef8aebdd9c76d805ed6a35b4a5d5a1b08))
* sandbox defaults in dev mode wrong ([2a24919](https://github.com/unraid/api/commit/2a2491936cf85013be836450ab7ed0cc11207e11))
* sequential test execution for generic-modification ([79ee1f7](https://github.com/unraid/api/commit/79ee1f7552cee47c6f5a8eb5942468292212e2f2))
* shell path to unraid-api ([15d11e4](https://github.com/unraid/api/commit/15d11e477bb2a08d785a7b22bd51900279a55508))
* simplify api setup index ([701b1fb](https://github.com/unraid/api/commit/701b1fbd9096c9675475062eaf32a2cbfb0567b9))
* simplify upcoming features ([8af79b2](https://github.com/unraid/api/commit/8af79b27501b42e1c1f7697756a56a9001000d8f))
* staging build issues ([e6bcb8d](https://github.com/unraid/api/commit/e6bcb8de7daee463f7ac0dbf977e085e108302ba))
* start command simplification ([e1faf3a](https://github.com/unraid/api/commit/e1faf3aa8db5973eb1bb0ea7a4844f820504618d))
* stop command exits ([2dbfdb6](https://github.com/unraid/api/commit/2dbfdb670a773114c0fdc68c7cf9d29fa4e28a9b))
* swap to placeholder key ([d1864d0](https://github.com/unraid/api/commit/d1864d0020ed56ab2368d23b48604b55cff21ae4))
* test issues ([e4b55b1](https://github.com/unraid/api/commit/e4b55b133bb2dc4bf2ccfd6fd2fc244daadbea53))
* test simplification to ensure no redownloads ([e07dad3](https://github.com/unraid/api/commit/e07dad3a6947aa186c4ac03032b5b3813cd046b6))
* tests ([25c1c1a](https://github.com/unraid/api/commit/25c1c1a55a3fb32b76bf5cb7257a4ba44f717a89))
* tests and validate token clears screen ([7f48ddd](https://github.com/unraid/api/commit/7f48dddcd2e2ea1ae3a55ecc54d5ac274535b714))
* type for generic test ([e856535](https://github.com/unraid/api/commit/e85653592a9d6eadcd0be89bf90a96c5d313fda3))
* unit test issues ([c58f7a7](https://github.com/unraid/api/commit/c58f7a7f246902c7d354eb51d1c87c8ea3b636a3))
* unit tests updated ([9548505](https://github.com/unraid/api/commit/954850535bec6b09aaf66b01d3ee749c8a22de5d))
* unneeded await on api-key service ([0325be7](https://github.com/unraid/api/commit/0325be757ee4c04b5c23365ff592f521a492595b))
* unused imports ([a5447aa](https://github.com/unraid/api/commit/a5447aa2f4c99968651fa3750d6bf0e8d68678de))
* update tests ([d0696a9](https://github.com/unraid/api/commit/d0696a93810893ccd6c676df1c639ca279992428))
* use an enum and defaults for sandbox value ([eb56483](https://github.com/unraid/api/commit/eb56483ba2693944d39f4409c91b75ee82a7d30b))
* use batchProcess ([ffbb9d7](https://github.com/unraid/api/commit/ffbb9d7750568bfa849d21e051503d1fcca5355f))
* use cwd when running application ([e016652](https://github.com/unraid/api/commit/e01665264b6f45366cdacf60c0f3553adfbd85d3))
* use placeholder in test API key ([c6b7755](https://github.com/unraid/api/commit/c6b7755214de8bedd5c0f2735473c2a559b1e26f))
* watch all events to load keys ([59ca177](https://github.com/unraid/api/commit/59ca17787e4d36113b0a8c5ef2117acfc491c49c))
* **web:** name of toaster component ([e093242](https://github.com/unraid/api/commit/e093242d20ddd72567396f4a53238250f2199a64))


### Miscellaneous Chores

* release 4.1.2 ([dbab290](https://github.com/unraid/api/commit/dbab290b429f9eff8fa903d193de2bd02bb392bd))

### [4.1.1](https://github.com/unraid/api/compare/v4.1.0...v4.1.1) (2025-02-20)


### Bug Fixes

* main.yml release issue ([8a2a24e](https://github.com/unraid/api/commit/8a2a24eb22762034d44995580d6057186521dae5))

## [4.1.0](https://github.com/unraid/api/compare/v4.0.1...v4.1.0) (2025-02-20)


### Features

* add category.json ([c9e87e2](https://github.com/unraid/api/commit/c9e87e2e5b47a8801b7865ed586c803d0b470915))
* add developer docs ([#1128](https://github.com/unraid/api/issues/1128)) ([bb2e340](https://github.com/unraid/api/commit/bb2e340b68268d5121db650b27e8b2580c7966bb))
* add unraid-ui documentation ([#1142](https://github.com/unraid/api/issues/1142)) ([c557806](https://github.com/unraid/api/commit/c55780680ae905558b79dfefa91b116aef22b105))
* attempt to resolve performance issues with rm earlier in build … ([#1152](https://github.com/unraid/api/issues/1152)) ([2a1aa95](https://github.com/unraid/api/commit/2a1aa95bd62ebfe42b62b8e7105c7a92b00cfca9))
* auto-docusaurus-prs ([#1127](https://github.com/unraid/api/issues/1127)) ([1147e76](https://github.com/unraid/api/commit/1147e762ae2fed6dea198fa38d6bcc514a1e66fb))
* bug report template ([f1ee8b2](https://github.com/unraid/api/commit/f1ee8b27b11fa969d0e6891590e44047c76eedb5))
* contributing guide ([c912476](https://github.com/unraid/api/commit/c912476b431750834c64bdec80a61fda23e6c490))
* convert to pnpm monorepo ([#1137](https://github.com/unraid/api/issues/1137)) ([8d89f8b](https://github.com/unraid/api/commit/8d89f8b20d6f3983d4e85b33827a857aa862db37))
* feature request template ([72a042c](https://github.com/unraid/api/commit/72a042c4fab295cf561807102c9eb9a78273bd83))
* fix docusaurus build + update snapshot ([23b27bd](https://github.com/unraid/api/commit/23b27bd63ea99f4137538eab40501daa67d7e3f5))
* public index ([f0641ea](https://github.com/unraid/api/commit/f0641ea7ca0919884dc3b8642c2e6694398e3246))
* reorder index ([858553f](https://github.com/unraid/api/commit/858553f0debb6424ae0614640b82a050c33f175a))
* simplify docs ([d428030](https://github.com/unraid/api/commit/d428030b806f55b62421559d434fc723786b03ad))
* upgrade workflow and auto-assign reviewers ([58a419e](https://github.com/unraid/api/commit/58a419ed36926d121e405a3de37bcb39f26f50b1))
* **web:** improve notification count syncing ([#1148](https://github.com/unraid/api/issues/1148)) ([af2057c](https://github.com/unraid/api/commit/af2057c643640270e3e152ff8e08c3045e622437))
* work intent ([feee4be](https://github.com/unraid/api/commit/feee4bebfe97620c73e6a6093065f22ea26ee8b9))
* work intent process ([b04a97a](https://github.com/unraid/api/commit/b04a97a493f06c450949c674629e8a787164464b))


### Bug Fixes

* **api:** change log output location for diagnostic compatibility ([#1130](https://github.com/unraid/api/issues/1130)) ([cba1551](https://github.com/unraid/api/commit/cba155138379d47bc3151c7c27d745ba6a345d83))
* **api:** logrotate modification & permissions ([#1145](https://github.com/unraid/api/issues/1145)) ([5209df2](https://github.com/unraid/api/commit/5209df2776e1a985e82bedc655fe28acf1fd0bde))
* connect breaks default css of header ([#1155](https://github.com/unraid/api/issues/1155)) ([4ac9aa3](https://github.com/unraid/api/commit/4ac9aa3e409d0d89f2be61bfbafb8d7b5a5b3b00))
* create PR ignored ([bdfefa8](https://github.com/unraid/api/commit/bdfefa808f5f1d85ff957a78a624edcef3afb47a))
* **deps:** update dependency dockerode to v4 ([#830](https://github.com/unraid/api/issues/830)) ([c331ecd](https://github.com/unraid/api/commit/c331ecd50c4910fd6c35e5ad92b3f676d552febc))
* docs creation workflow ([86134c6](https://github.com/unraid/api/commit/86134c60856c130dab9f96b718d9afa5bbab1e50))
* make public not a part of folder structure in PR ([099a88e](https://github.com/unraid/api/commit/099a88eb4970da48e57dafbc3807e16f1987d7fc))
* PHP Warning in state.php ([#1126](https://github.com/unraid/api/issues/1126)) ([c154b4e](https://github.com/unraid/api/commit/c154b4e0ad2d0627b1541a7f9ee5e55235d4dd5e))
* revert dockerode upgrade ([#1140](https://github.com/unraid/api/issues/1140)) ([a74a379](https://github.com/unraid/api/commit/a74a379a93fd15a315e31191de1bf69c5879f8a6)), closes [unraid/api#830](https://github.com/unraid/api/issues/830)
* shorten work intent form ([95fe671](https://github.com/unraid/api/commit/95fe671717ab856518f5b4893dfbcbade0d0f2ed))
* simplify api setup index ([701b1fb](https://github.com/unraid/api/commit/701b1fbd9096c9675475062eaf32a2cbfb0567b9))
* simplify upcoming features ([8af79b2](https://github.com/unraid/api/commit/8af79b27501b42e1c1f7697756a56a9001000d8f))
* storybook resolution issue ([#1153](https://github.com/unraid/api/issues/1153)) ([52c70b9](https://github.com/unraid/api/commit/52c70b9d85469008894d44788429ba298b082ac7))
* upload to correct tag directory on build ([c5fe723](https://github.com/unraid/api/commit/c5fe723a0abee0d0fc494a5b512c995001ae0615))
* **web:** broken modals ([aebf339](https://github.com/unraid/api/commit/aebf3392595d45c84a84668f461c632a2d62e7dd))
* **web:** name of toaster component ([e093242](https://github.com/unraid/api/commit/e093242d20ddd72567396f4a53238250f2199a64))

### [4.0.1](https://github.com/unraid/api/compare/v4.0.0...v4.0.1) (2025-02-06)

## [4.0.0](https://github.com/unraid/api/compare/v3.11.0...v4.0.0) (2025-02-06)


### Features

* actual install url ([89d667e](https://github.com/unraid/api/commit/89d667e33bffb17df43c768f12c21302571270ff))
* actually exit on stop and start ([bce5fde](https://github.com/unraid/api/commit/bce5fde64278dd853e71c022c03b9f6888dccfcf))
* add api key creation logic ([81382bc](https://github.com/unraid/api/commit/81382bcf1d26364ad9c5445530f648209101cf91))
* add command to package.json scripts ([0dfb07f](https://github.com/unraid/api/commit/0dfb07f9eb519e60441f4123423f65acfdffca3b))
* add csrf support to api & web components ([#999](https://github.com/unraid/api/issues/999)) ([19241ed](https://github.com/unraid/api/commit/19241ed55f5112f878b9890d8695badf7eb1c3eb))
* add date formatting helper ([#938](https://github.com/unraid/api/issues/938)) ([b8c8b00](https://github.com/unraid/api/commit/b8c8b005410bbb612014f34ada51ca23cae67a30))
* add deletion & update methods to NotificationService ([ac82b08](https://github.com/unraid/api/commit/ac82b08a9e865cd095cfb5c484404f9e7383391e))
* add description flag, remove console log, and update readme ([c416c30](https://github.com/unraid/api/commit/c416c30951de4ed6b8d7a8c014403772db1c2015))
* add deviceCount to serverAccountPayload for callbacks ([0fb8b87](https://github.com/unraid/api/commit/0fb8b87ff2645ec642d2f038e5f941a880274817))
* add ecosystem.config.json to files ([913febc](https://github.com/unraid/api/commit/913febc0e461bfe052fe116e76d9871e54584aa2))
* add exclude to vite.config ([e64dde7](https://github.com/unraid/api/commit/e64dde7a23414a2e649bef999de8e2164c7b507f))
* add ID prefix plugin to prefix IDs with server identifier ([066e93a](https://github.com/unraid/api/commit/066e93a52afa17f53df2f238065d853ce2945a1e))
* add line about recommendation for sso command ([44727a8](https://github.com/unraid/api/commit/44727a8d1a7c16c566678da43119b17a6303e375))
* add log rotation ([f5c7ad9](https://github.com/unraid/api/commit/f5c7ad9221f80e4630e69f78d57f08f4c7252719))
* add logging around fixture downloads ([a1ce27b](https://github.com/unraid/api/commit/a1ce27b17c970657f52635600f0d13116523f928))
* add logrotate cron again ([4f85f66](https://github.com/unraid/api/commit/4f85f6687f920dae50277e726e2db2c3d946e867))
* add patch for auth-request.php ([ec6ec56](https://github.com/unraid/api/commit/ec6ec562f43aac9947de2e9c269181303f42b2db))
* add user with cli ([37458cd](https://github.com/unraid/api/commit/37458cd7408a1ad8aedca66a55ff13ac19ee30db))
* add validation step to ensure that variables are set ([e3e9b2b](https://github.com/unraid/api/commit/e3e9b2bf404cb6f3bcae83db0395be272e4b79e3))
* add web gitignore ([8b49190](https://github.com/unraid/api/commit/8b491900947c9a7a63b7ad61e7d355ff2fd1f801))
* address log level feedback ([49774aa](https://github.com/unraid/api/commit/49774aae459797f04ef2866ca064050aa476ae91))
* allow csrf passing through querystring ([dba38c0](https://github.com/unraid/api/commit/dba38c0d149a77e4104c718c53d426330a17f2fa))
* allow deletion and creation of files with patches ([32c9524](https://github.com/unraid/api/commit/32c952402c25e8340b1c628b4d0fdc4816b28ade))
* almost working ([df1fc6d](https://github.com/unraid/api/commit/df1fc6dffaa242d85d8ab79f2bfe9e9b1de4b261))
* also copy in other files ([599b365](https://github.com/unraid/api/commit/599b365e8b668d9fba9d88f3d0d03fb7f63244cb))
* always ensureDirectory for keys exists ([c6e9f80](https://github.com/unraid/api/commit/c6e9f804c58e44b46bce9f0da2260888544354cd))
* always start the API and run npm link from script path ([30133ac](https://github.com/unraid/api/commit/30133acb0514a480177f563d4aee364a8a3fab1b))
* **api:** add default dynamix config to dev docker container ([0aeea34](https://github.com/unraid/api/commit/0aeea34427805a9b61a762efbd01c938016be28c))
* **api:** graphql sandbox on unraid servers ([#1047](https://github.com/unraid/api/issues/1047)) ([ec504f3](https://github.com/unraid/api/commit/ec504f39297c92b64d9d3cc2f8f482cc1f3a2e44))
* **api:** omit tz from sys time date format by default ([b2acde3](https://github.com/unraid/api/commit/b2acde3351d7afe18a2902e90b672537aadabffd))
* **api:** rm 2fa & t2fa from myservers config type ([#996](https://github.com/unraid/api/issues/996)) ([89e791a](https://github.com/unraid/api/commit/89e791ad2e6f0395bee05e3f8bdcb2c8d72305dd))
* **api:** sort notifications file listing by date (latest first) ([cae8d0b](https://github.com/unraid/api/commit/cae8d0bc07a465d73f0242a8d68816fd0a6042c7))
* array iteration for restoring files ([036e97b](https://github.com/unraid/api/commit/036e97bb02e463872b3c2f4b5f1aa3b4bf525d1e))
* async disk mapping ([bbb27e6](https://github.com/unraid/api/commit/bbb27e686897e4f9a0c926553d75aa046d7a8323))
* async hypervisor and FIXED vm listing ([e79f4dd](https://github.com/unraid/api/commit/e79f4ddbc7061c249efb8214a311bb629628f669))
* attempt to fix pm2 ([ab67717](https://github.com/unraid/api/commit/ab67717d5954ae3965c1e4082605af5e42f73ca2))
* attempt to start unraid-api with background task ([2a102fc](https://github.com/unraid/api/commit/2a102fc9944f3080af66a8ebadee35059bce2009))
* **Auth:** add cookie guard to check for valid sessions ([3dffc0c](https://github.com/unraid/api/commit/3dffc0c663cfbe8c4368ab98c834baf611a8910a))
* **auth:** make cors aware of authenticated sessions ([f9c23aa](https://github.com/unraid/api/commit/f9c23aa8852a8335640bbd16caa783e9a38b449c))
* automatic session setup for dev ([36d630e](https://github.com/unraid/api/commit/36d630e89bbf9bc7e3ae64bdf5cf73a8536d44ab))
* back to callbackUrl ([e39b120](https://github.com/unraid/api/commit/e39b1203a315889c5b5232ecfd32c7377ae04800))
* begin building plugin with node instead of bash ([#1120](https://github.com/unraid/api/issues/1120)) ([253b65a](https://github.com/unraid/api/commit/253b65a85ab9c5f53d53ef265b41aa132678f278))
* begin fixing dark mode in the webcomponents ([5f7dcdb](https://github.com/unraid/api/commit/5f7dcdb1a7e7bce87b29add7849c94a0353c2c96))
* begin nuking alpha beta gamma ([25acd4b](https://github.com/unraid/api/commit/25acd4b39fff9a0cb573f9e90c52830fef41d737))
* better patch application ([a3e7daa](https://github.com/unraid/api/commit/a3e7daa6a6565ac81004ffd13da35d8b95b429cf))
* better pm2 calls, log lines ([338ce30](https://github.com/unraid/api/commit/338ce3061310dfc42ad5f65edacbe5272de4afc7))
* build and pack in docker ([2a322d1](https://github.com/unraid/api/commit/2a322d12570ba3e797fb84289a42b010f3f88467))
* buildx build caching ([b38be3c](https://github.com/unraid/api/commit/b38be3ceb7c7299fe30c90ed5a75e131af3b33da))
* checkout correct branch on close ([#1123](https://github.com/unraid/api/issues/1123)) ([a20b812](https://github.com/unraid/api/commit/a20b812b020adfade129ebd9fb0e6536004f8bee))
* cleanup config entries ([943e73f](https://github.com/unraid/api/commit/943e73fa696b6ecec3227be914ab4962c4fee79d))
* cleanup disclaimer and command to add users ([6be3af8](https://github.com/unraid/api/commit/6be3af8d7569d9c413dd9349df52e3fa4cb4f631))
* cleanup unused variables ([b50e289](https://github.com/unraid/api/commit/b50e2896f765cecfe631aa839186a6124beb41a3))
* cli Commands ([f8e5367](https://github.com/unraid/api/commit/f8e5367f3eb47daa5bcbd7711ae5835369502a1d))
* CLI options for adding and deleting users ([16bf6d4](https://github.com/unraid/api/commit/16bf6d4c27ae8fa8d6d05ec4b28ce49a12673278))
* code review changes ([fe38acc](https://github.com/unraid/api/commit/fe38acc92e4b1891b0b61fdb4947ec91070cb535))
* codeowners ([ab090b4](https://github.com/unraid/api/commit/ab090b48ec7291597a135a72b8e55c2d1bb389f3))
* coderabbit suggestion ([11ac36c](https://github.com/unraid/api/commit/11ac36c3616a90853d91467526fd39ecba17db88))
* comment URL for plugin on PR ([9840b33](https://github.com/unraid/api/commit/9840b334b4466a4f72e3e57055338a3d5557553d))
* configure PM2 on startup ([2b908f1](https://github.com/unraid/api/commit/2b908f100b9eefaccf2264d5ff9945667568acf0))
* copy ([7e33e5c](https://github.com/unraid/api/commit/7e33e5ca32e95168bb82f090c1acaee43bce1f25))
* copy node modules ([bb0436c](https://github.com/unraid/api/commit/bb0436c7fec54be9ea63681104e720bb5b499f58))
* copy only needed files for nodejs ([acf587a](https://github.com/unraid/api/commit/acf587aa53ca25a3beae86afc608fc9ed68919ef))
* create key cli command logic and add to index command list ([9b2a62d](https://github.com/unraid/api/commit/9b2a62d642b0942e3787e4ddd582a66e40321ab2))
* csv validation ([84aae15](https://github.com/unraid/api/commit/84aae15a73014592c226fa3701e34e57c7b60b46))
* default value for option ([6513fc4](https://github.com/unraid/api/commit/6513fc49de61c836e1aabf32a874d7da7da18adb))
* delete unused imports ([97a3772](https://github.com/unraid/api/commit/97a3772d95aff534d85c410e58391d30494d9237))
* diff ([02c0c5f](https://github.com/unraid/api/commit/02c0c5f8e09476ddcd207c49e1c7d6c764c40d69))
* disable button on submit ([2ceb5da](https://github.com/unraid/api/commit/2ceb5da3c70826cc50df476decb6b117025f46c0))
* disable casbin logging ([2518e7c](https://github.com/unraid/api/commit/2518e7c506f0d3aa9f44031d61dce95d9db0a4cf))
* do not move upgradepkg ([ea16419](https://github.com/unraid/api/commit/ea16419929e0233e2c1ce37e2f4b79e3e64ce619))
* docstrings ([b836ba7](https://github.com/unraid/api/commit/b836ba72516c554ee8973d69aaaa4ed35b465fa7))
* don't remove directory, only files ([c2227cb](https://github.com/unraid/api/commit/c2227cbaadbbfe3dda6a89690a396db5bd6db444))
* dont pass entire server state for privacy ([54e3f17](https://github.com/unraid/api/commit/54e3f17bd9e541f50970c696bbe8b602ec38a748))
* download fixtures from the web ([1258c2b](https://github.com/unraid/api/commit/1258c2bc1813f0fa3cd52b4932302ad12b4edd01))
* download nodejs and install on legacy OS versions ([2a95e4b](https://github.com/unraid/api/commit/2a95e4beb2364510003f187459e28bb610583c41))
* eliminate all alpha beta gamma variable usage ([fbdbce9](https://github.com/unraid/api/commit/fbdbce97ec2171ec7057f0f159e73032e984705a))
* enable PR releases on non-mainline merges ([7ae8d03](https://github.com/unraid/api/commit/7ae8d03166952a602f0b7ebaf1cc65a9a8d27e7b))
* enable sandbox in dev mode ([4536d70](https://github.com/unraid/api/commit/4536d7092d77c68f5a996fd63bf74ce6e64f5efe))
* enable sandbox with developer command ([c354d48](https://github.com/unraid/api/commit/c354d482283295547afeb99c5e110b0181197c44))
* enable token sign in with comma separated subs in myservers.config ([ebed5bd](https://github.com/unraid/api/commit/ebed5bddea1445d9aaaee60d54758dc74b77271e))
* error state outside of button ([18c63e0](https://github.com/unraid/api/commit/18c63e0b0c7451c99eacabb504e18f8070ff7dc2))
* error when nodejs download fails ([6a9b14c](https://github.com/unraid/api/commit/6a9b14c68170d6430328cbb793d750f3177bdb32))
* exit after running status ([12f551c](https://github.com/unraid/api/commit/12f551c9d91692b40b73d96133d45c04f795548e))
* exit cli after running command ([04bf528](https://github.com/unraid/api/commit/04bf528616fcbdf916916734a12d5fd32db9a06d))
* expose mutations for notifications over graphql ([59dc330](https://github.com/unraid/api/commit/59dc33029d03c3d3cda5b4c2a60772e2b7d01811))
* extensive file checking ([ab881c8](https://github.com/unraid/api/commit/ab881c8aed8dd4aa9fd71c32b50d3514d1496fa5))
* extract node to usr/local/ ([4c0b55b](https://github.com/unraid/api/commit/4c0b55b269f47a9d8f746344ae701e353d80509a))
* fallback to local ([a2579c2](https://github.com/unraid/api/commit/a2579c2a7f80f54b4cc61533aec9ecc41a7e7f54))
* faster failure logic ([b439434](https://github.com/unraid/api/commit/b439434f1574e174fcf23f3a5f5b8df8e092eb1e))
* fix header strategy ([4187b77](https://github.com/unraid/api/commit/4187b77a107c0f37e47a1e272c5acb9b798ad3be))
* fix issues with permissions and invalid modules ([e0cfb40](https://github.com/unraid/api/commit/e0cfb40c847a53def1057ae00c97f9306713c3d1))
* fix missing flash line ([6897aad](https://github.com/unraid/api/commit/6897aad67f5c8b38450aa81e612b8aa98a9328c7))
* fix missing import in ESM ([8e99bdd](https://github.com/unraid/api/commit/8e99bdd8f97e772b07374d833debff4eadbf6501))
* fix more imports ([028df06](https://github.com/unraid/api/commit/028df06cd2279d219bd0b3039ad8680de6138b83))
* fix pm2 setup and add link command ([de9500f](https://github.com/unraid/api/commit/de9500ffa6f3aa1842152e0ab26f54c8c5c6e5cb))
* force linting on build ([43e6639](https://github.com/unraid/api/commit/43e663998a55e83c142067cb64ae7a331395fe68))
* generate key one time ([afe53c3](https://github.com/unraid/api/commit/afe53c30ea9987e6d8728faa2cb7291f8a126ecb))
* glob for files ([3fe281f](https://github.com/unraid/api/commit/3fe281f1ae28e3cbc089b5244a6ae2863b20adcb))
* hide sign in from the dropdown text ([3e68aaf](https://github.com/unraid/api/commit/3e68aaf8cdc0fb20c6e1b819a8571f419d94a811))
* hypervisor async imports ([32686ca](https://github.com/unraid/api/commit/32686ca4f0c25c43c6a9f7162bb8179b39e58f7e))
* ID prefixer improvement ([ed55b32](https://github.com/unraid/api/commit/ed55b32645d7414657c7775d5a786fa2653294d5))
* ignore generated code ([68265a2](https://github.com/unraid/api/commit/68265a26efa588b60001310b9a11b398f04ae88f))
* implement mutations for updating many notifications at once ([6c90508](https://github.com/unraid/api/commit/6c90508c64e453849d06818cca2a3f6f7dfbf172))
* improve packing ([9ef02d5](https://github.com/unraid/api/commit/9ef02d53666b70d41fdd186364808deac715e1ff))
* initial patcher implementation using the diff tool ([c87acbb](https://github.com/unraid/api/commit/c87acbb146c2e4e30997c964cd8be325dee68cea))
* initial setup of permissions on keys ([#1068](https://github.com/unraid/api/issues/1068)) ([cf0fa85](https://github.com/unraid/api/commit/cf0fa850954ea2f018e338a132149f872b966df4))
* initial version of modification service ([b80469d](https://github.com/unraid/api/commit/b80469d38e519a7ba0e6eae636cda2a821e2d465))
* inject after form ([a4b276f](https://github.com/unraid/api/commit/a4b276f7874580bbf9827025730777715c9983da))
* install nghttp3 ([7e6cf85](https://github.com/unraid/api/commit/7e6cf858b270e615ec3eeddd394d0c2e6d810e21))
* install node ([4b85338](https://github.com/unraid/api/commit/4b853389d4ee7d0fb8e539d948dac21e748f642a))
* integrate cross-domain authentication to api ([7749783](https://github.com/unraid/api/commit/77497830c13d8e3ce1c348a8c79d8835ad5e3eb2))
* kill timeout extended ([22d4026](https://github.com/unraid/api/commit/22d40264a02672a818053b5280d63a03ff7336b9))
* linting continues on error ([a3499d6](https://github.com/unraid/api/commit/a3499d6feee56319657c37bb77277d5c637ee0b5))
* log size and only tar files ([731f2f8](https://github.com/unraid/api/commit/731f2f8e77a77b544a7f526c78aabfacca71eee4))
* logrotate test ([4504c39](https://github.com/unraid/api/commit/4504c39a2bbcf51385578b69a9fdc7b81a950e98))
* lots of progress on colors ([dc8b2ee](https://github.com/unraid/api/commit/dc8b2ee01b454d307e779d495dbcf11227760480))
* make notification id logic ([d5e0b3a](https://github.com/unraid/api/commit/d5e0b3a81ef3406b40e3376b5bca2fd101aa9c11))
* manually install libvirt in build process to ensure it is included in the final build ([e695481](https://github.com/unraid/api/commit/e695481363f0d5d7add9d0e0d50d1e113b3024f6))
* massive rc.unraid-api updates to facilitate installing and linking ([ded03d8](https://github.com/unraid/api/commit/ded03d86b25b51af98de2b7e7397a641dd0c082a))
* more cleanup ([9f6aeec](https://github.com/unraid/api/commit/9f6aeecfd90d069a0b2a642f99ef9622f4e0526d))
* more pm2 fixes ([8257bdf](https://github.com/unraid/api/commit/8257bdff3624211ee645349abdec303bf271538e))
* more process improvements ([9491be1](https://github.com/unraid/api/commit/9491be1038ee2e0e24be111bd8e8c78ec2890124))
* mount git folder to builder ([91350ea](https://github.com/unraid/api/commit/91350ea8535511c964d5869bd74a37830fc1bc40))
* move fixtures into __test__ folder ([22a901d](https://github.com/unraid/api/commit/22a901de9b0c274d3f75ed4b4618cd6cd90324ba))
* move ssoenabled to a boolean flag rather than ids ([404a02b](https://github.com/unraid/api/commit/404a02b26bae6554d15e317f613ebc727c8f702f))
* move to singular build and test step ([c9c8e86](https://github.com/unraid/api/commit/c9c8e8653321eaa0292a16e970d6dd4e79a3928f))
* move variable declarations to theme.ts ([3c82ee1](https://github.com/unraid/api/commit/3c82ee1e9acc197c9768a624cdef8c2e23c56d00))
* myservers_fb keepalive location ([e07e7f3](https://github.com/unraid/api/commit/e07e7f335c8ea4a73966ada90c26b7c82dbb025e))
* name package with PR number ([a642bf1](https://github.com/unraid/api/commit/a642bf15fd813dca522808765994414e4ed5a56c))
* nghttp3 sha256 missing ([589cc9b](https://github.com/unraid/api/commit/589cc9b4624d9d0e00ec3b86873d8ecb6a861427))
* nodejs issues with version 2 ([9c6e52c](https://github.com/unraid/api/commit/9c6e52c2fa46e7504bc3fa500770373d8c1d1690))
* **NotificationService:** endpoint to manually recalculate notification overview ([18e150f](https://github.com/unraid/api/commit/18e150f908b937cccd13171830fc418c3600cdbe))
* **NotificationsService:** use existing notifier script to create notifications when possible ([2f1711f](https://github.com/unraid/api/commit/2f1711f06a2fa0a679aeae12176cb2dd763494a4))
* nuxt config simplification and formatting ([02ffde2](https://github.com/unraid/api/commit/02ffde24d19594949faa97f9d070383b498fdcbe))
* only run mainline build ([b6ee6f9](https://github.com/unraid/api/commit/b6ee6f9c9f7740e91856754caecb6630bc62f37b))
* only write config when a specific config update action occurs ([ec29778](https://github.com/unraid/api/commit/ec29778e37a50f43eb164991bcf2a6ff9c266033))
* or button on sign in page ([1433e93](https://github.com/unraid/api/commit/1433e938d7ac01af326e2875c582a6aa6d622615))
* pack everything in API ([178a6f6](https://github.com/unraid/api/commit/178a6f6b0d7cf2fc4b2ad4cfbd9a928f880c222c))
* package scripts ([123aa77](https://github.com/unraid/api/commit/123aa77fe6f21e64809083d8b872ef2152be1ad1))
* pass env into builder ([e75ac99](https://github.com/unraid/api/commit/e75ac99d8e19e7ea66671c211bd4cf85ec3b81b0))
* plg builder improvements to be more explicit ([78c2f03](https://github.com/unraid/api/commit/78c2f035da0f0c6aaaedbee11c8c4f2a8cd42d0f))
* **plugin:** rm Date & Time format settings from Notification Settings ([e2148f3](https://github.com/unraid/api/commit/e2148f3c2eaf77ad707eddb7989cc20ec8df70ab))
* pm2 fixes ([5b322b4](https://github.com/unraid/api/commit/5b322b4faed6e8f0bb0742832cb94c8027d0e12b))
* pm2 fully working ([ecb642b](https://github.com/unraid/api/commit/ecb642b6a88bd66c3ccd1f4e1dcd2c92d7ff4b35))
* pm2 initial setup ([3cee381](https://github.com/unraid/api/commit/3cee381c442032d24c9c33dfa6d8a43581061fca))
* PR builds ([0025852](https://github.com/unraid/api/commit/00258524fa3f7ed745abfe471dfdb780b6d2b365))
* process env fixed and copy gql files ([8b90620](https://github.com/unraid/api/commit/8b90620d28378caabc7bbc1745ca43a1ddf8bd87))
* properly read log level from environment ([b5151e9](https://github.com/unraid/api/commit/b5151e9ba76a6814e24e8da34e8a3c1bf1cc2144))
* properly set outputs ([aa6904e](https://github.com/unraid/api/commit/aa6904e0a455a75a8187259d491b04366ad50fb0))
* rem converter ([d2489df](https://github.com/unraid/api/commit/d2489df6eaaa267a2f51b896c6c14ac9c5b00f85))
* remove apiKey from server ([b110a11](https://github.com/unraid/api/commit/b110a118fb153c0af09a74755deb468b3760ba27))
* remove console log disabler ([0cf24d2](https://github.com/unraid/api/commit/0cf24d2a212e1f44e0b379221c93aa436c3b7179))
* remove many unneded simple libraries ([483e6dc](https://github.com/unraid/api/commit/483e6dc28d70b933dc956b4ffd6da4ade8ab7eb9))
* remove more unused calls ([5d2923f](https://github.com/unraid/api/commit/5d2923f8ee5bfd574420fca85e2c4aefbe7b33d6))
* remove nghttp3 and only bundle nodejs ([8d8df15](https://github.com/unraid/api/commit/8d8df1592e5af127a992d5634ee9d344055cdf2c))
* remove sso if disabled on Unraid-API start ([3bc407c](https://github.com/unraid/api/commit/3bc407c54e8e7aeadebd9ac223d71f21ef97fca1))
* remove sso user command ([bbd809b](https://github.com/unraid/api/commit/bbd809b83826e81eef38a06e66f3393e4f83e81e))
* remove sso user options ([e34041f](https://github.com/unraid/api/commit/e34041f86ef7ab6cf5e2fdf7efb86458d190edc1))
* remove unused config sections ([f0b9c4f](https://github.com/unraid/api/commit/f0b9c4f44ab0ee8f75bf96fde2413988ef4f6a8c))
* remove unused fields ([d2d0f7c](https://github.com/unraid/api/commit/d2d0f7cd9acb53ea2372245d7ef669c7ca24ee8a))
* remove unused vars ([0507713](https://github.com/unraid/api/commit/0507713972e344ad47bd077554d5888269669e9c))
* remove wtfnode ([cbdcc47](https://github.com/unraid/api/commit/cbdcc476b617539611478cf6f29bbb57d0be83b3))
* rename api key resource back to api_key ([ee9666b](https://github.com/unraid/api/commit/ee9666b317d7feb5c15d53e2a6b902c7771c8c7a))
* rename modification file ([70a93f2](https://github.com/unraid/api/commit/70a93f2cc63e0e62242be6fe1a717515a6fbec85))
* responsive notifications ([d427054](https://github.com/unraid/api/commit/d427054443176563faa3e44249219c1d938e4b07))
* restart the API when an SSO user is added ([a6b0c90](https://github.com/unraid/api/commit/a6b0c906a423df048401750943f02dfdc9bc2619))
* restoring sso error ([234bf7d](https://github.com/unraid/api/commit/234bf7dfa4b0be88b6cc13996d8f29ec819da26e))
* revert local api key value ([ff40e7a](https://github.com/unraid/api/commit/ff40e7ae392052d3d9e1b084c5f4851e8ebd529e))
* right workin directory ([0d99ab0](https://github.com/unraid/api/commit/0d99ab0d74356e4ea309cb86dfc710ed93ab70e7))
* rollback if patch exists before applying ([c2f4e8d](https://github.com/unraid/api/commit/c2f4e8d4e5c758601bd20ba491fd077b434ba45e))
* secondary changes ([d75331a](https://github.com/unraid/api/commit/d75331a67e3566875ce8642fce80195e79932a4c))
* separate install process ([b90a516](https://github.com/unraid/api/commit/b90a51600c3f70615b117f157d41585e55ef49de))
* server identifier changes ([b9686e9](https://github.com/unraid/api/commit/b9686e9c67f2a48df419848e18c5451123813185))
* service tests for modifier service ([08c1502](https://github.com/unraid/api/commit/08c150259f2b4630d973803f4edff69c8bf0ec3a))
* session issues ([5981693](https://github.com/unraid/api/commit/5981693abd605337f9174ba4c85fd1bfc243edeb))
* set background color on webcomponents ([b66e684](https://github.com/unraid/api/commit/b66e6847c895f216a5dec42410186b81a31af1a9))
* shared call to createPatch ([eb3e263](https://github.com/unraid/api/commit/eb3e263fb32a748bfa06ec6d119ee51d242707cf))
* sidebar notification count ([694f01b](https://github.com/unraid/api/commit/694f01b6c4ab83c4131ae42bc11002d0300497c5))
* simplify getting version ([8fb8cb3](https://github.com/unraid/api/commit/8fb8cb304ee1b0f007b81a679dc3eadf098f6b4b))
* sso button token exchange ([f6f2390](https://github.com/unraid/api/commit/f6f2390b0169ceaf90ab88edfab3f2809bfe86b5))
* sso testing page and form disable on submit ([ffc6d8a](https://github.com/unraid/api/commit/ffc6d8a286d7c6ba751894464000f9870784507c))
* start command path ([a7aece5](https://github.com/unraid/api/commit/a7aece5570d3fdb073bda1dc7a89b7ea6e7eedf6))
* state using crypto ([afce130](https://github.com/unraid/api/commit/afce13099f5018d0c39765bfdd181adc8383a105))
* style improvements ([b0f395e](https://github.com/unraid/api/commit/b0f395ef76f11047eaa13091df277df0459e9d8f))
* substantial docs updates ([928bd03](https://github.com/unraid/api/commit/928bd03a4853a28a6b563ed82f95681a7f712b3a))
* swap to action ([ef7281b](https://github.com/unraid/api/commit/ef7281b2a863422593de5e948fcfad1a6df489f2))
* swap to async exit hook ([4302f31](https://github.com/unraid/api/commit/4302f316820a109c76408092994727b2dc030a15))
* switch to nest-commander ([1ab2ab5](https://github.com/unraid/api/commit/1ab2ab5b58a1f49cd6b05aaa84bfeced49d68e8e))
* track node version in slackware ([42b010e](https://github.com/unraid/api/commit/42b010e4a141f2a338d65f4f727bf1d15521a5c6))
* try catch restart ([89abee6](https://github.com/unraid/api/commit/89abee680bdbdaa9946ddb991f0e6b5ada9ccdf7))
* **ui:** webgui-compatible web component library ([#1075](https://github.com/unraid/api/issues/1075)) ([1c7b2e0](https://github.com/unraid/api/commit/1c7b2e091b0975438860a8e1fc3db5fd8d3fcf93))
* unnecessary comment ([0c52256](https://github.com/unraid/api/commit/0c5225612875b96319b28ef447db69ecab15cfda))
* unraid single sign on with account app ([5183104](https://github.com/unraid/api/commit/5183104b322a328eea3e4b2f6d86fd9d4b1c76e3))
* unraid ui component library ([#976](https://github.com/unraid/api/issues/976)) ([03e2fee](https://github.com/unraid/api/commit/03e2feebc73d620b21e54912e0bbddc1826880e1))
* update based on review feedback ([4383971](https://github.com/unraid/api/commit/43839711e3365e31120e156abac3746c55e8e694))
* Update plugin/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php ([42c0d58](https://github.com/unraid/api/commit/42c0d58da4d0570b7d865a8774964c18120ed585))
* upgrade dependencies ([0a0cac3](https://github.com/unraid/api/commit/0a0cac3da74c2fe20f7100a9ad5d1caafa74b157))
* upload files directly to cloudflare ([1982fc2](https://github.com/unraid/api/commit/1982fc238fefa1c67323bdc11ec1fb9c9f43c387))
* use execa for start and stop ([46ab014](https://github.com/unraid/api/commit/46ab0144d41b425015487c251c1884744223ba29))
* use plugin file for install and uninstall ([c9ac3a5](https://github.com/unraid/api/commit/c9ac3a5a0a3103fbd9c33a5d909fa475614a704a))
* use state passing to validate requests ([4480c14](https://github.com/unraid/api/commit/4480c14c932fd8b42ba44989abdbecb49252e6f3))
* use text-secondary-foreground instead of gray ([463a1f7](https://github.com/unraid/api/commit/463a1f7b611599a19a23d3c75156c0a16da83312))
* use zod to parse config ([19cf1be](https://github.com/unraid/api/commit/19cf1be079f2ccb9e0cfa10f2fb97a18f15c5729))
* validate entries correctly ([b101a69](https://github.com/unraid/api/commit/b101a695e18d71ddd170462b3d49289352166489))
* validate token format in both PHP and CLI ([6ef05a3](https://github.com/unraid/api/commit/6ef05a3d7770f799e7d587c2cef8d29f6058bee1))
* viewport watch refactor ([9aefa38](https://github.com/unraid/api/commit/9aefa382ec64f08b1da8a3748ce16f637d562c8c))
* vite ([c78ba4a](https://github.com/unraid/api/commit/c78ba4a774d053d4a9dca938020e4393c5a1fc75))
* vite dev mode ([7646c6b](https://github.com/unraid/api/commit/7646c6b6c437a2b523245a29d829ead44fb57d28))
* warning on missing fields ([0ef9aec](https://github.com/unraid/api/commit/0ef9aecccdde879e3be44d0b2a0fa4d8befc53b5))
* **web:** activation modal steps, updated copy ([#1079](https://github.com/unraid/api/issues/1079)) ([8af9d8c](https://github.com/unraid/api/commit/8af9d8c58895010e3ddc03cc5fa075ac1e264f50))
* **web:** add an 'all' option to notification filter ([7c2a72e](https://github.com/unraid/api/commit/7c2a72e0c9537827c3c96df7b6378c03e2cc2852))
* **web:** add confirmation before archiving or deleting all notifications ([d16f08c](https://github.com/unraid/api/commit/d16f08c266953ddb84223f90f1275d19c9d3c380))
* **web:** add count labels to notification tabs ([4caea3d](https://github.com/unraid/api/commit/4caea3dfc2c7067062f3ce8d863f9385ad030dbd))
* **web:** add delete all notifications button to archive view in notifications sidebar ([3bda9d6](https://github.com/unraid/api/commit/3bda9d6a4ca01cc5580012b0133e72929d6dab40))
* **web:** add empty state to notifications list ([5675fe1](https://github.com/unraid/api/commit/5675fe14d9d36ab638cb5e1b907f24bcf71cb7f1))
* **web:** add gql archival mutations to notifications sidebar & item ([5f93be9](https://github.com/unraid/api/commit/5f93be9f55f3262502951a726f8fc015d73abc92))
* **web:** add link to settings in notification sidebar ([f1a4d87](https://github.com/unraid/api/commit/f1a4d873481c212ffde1af7e38327a53a7e41d43))
* **web:** add loading and error states to notification sidebar ([2e9183a](https://github.com/unraid/api/commit/2e9183a479e0ec5f7cfc34bb81ccfd05e4bd2b29))
* **web:** clear notifications indicator after opening sidebar ([68958d1](https://github.com/unraid/api/commit/68958d17b78220c77c3cda4f0f4068b3ce623688))
* **web:** delete notifications from archive view ([c8fc15d](https://github.com/unraid/api/commit/c8fc15d20bae527193ed289aef622a953a0d00bc))
* **web:** display error when a notification mutation fails ([838ed86](https://github.com/unraid/api/commit/838ed86ffa47207ca2282a9ddabe245da713ba23))
* **web:** enhance notifications indicator in UPC ([#950](https://github.com/unraid/api/issues/950)) ([6376848](https://github.com/unraid/api/commit/63768486e4ec64ab32666a26adf96f4db4a53e81))
* **web:** implement notification filtering ([fa5156b](https://github.com/unraid/api/commit/fa5156bbc1f6bcc6c2e71b64b1e063120a868410))
* **web:** make empty notification message clearer ([abab00d](https://github.com/unraid/api/commit/abab00ddccb7e485f2603b554704f531be79dd45))
* **web:** make notifications list scrollable inside the sheet & tabs ([4c5d97b](https://github.com/unraid/api/commit/4c5d97b380de5574226e653c372c45ce61ea3ebb))
* **web:** move notification indicator icons to top-right of bell icon ([2fe4303](https://github.com/unraid/api/commit/2fe4303387023d303d7e50fc4d9a41f1eafdcc45))
* **web:** open official release notes via header os version ([54a893f](https://github.com/unraid/api/commit/54a893f396b29251b982ff1f26d376d24b962b93))
* **web:** pull date format from display/date and time settings ([b058067](https://github.com/unraid/api/commit/b058067b628ca7866a9ba0a6c4c5e4d5505d98cb))
* **web:** reconcile pagination with notifications apollo cache ([e38bc2c](https://github.com/unraid/api/commit/e38bc2c1218019cd1632123709620808c7543d11))
* **web:** remove notification indicator pulse ([f320a77](https://github.com/unraid/api/commit/f320a77330c8cc7b92e170b0099d6c7f93b11c0e))
* **web:** rm api-key validation from connect sign in ([#986](https://github.com/unraid/api/issues/986)) ([7b105d1](https://github.com/unraid/api/commit/7b105d18678e88a064f0643d6e857704789e0ee8))
* **web:** rm old notification bell upon plugin installation ([#979](https://github.com/unraid/api/issues/979)) ([e09c07c](https://github.com/unraid/api/commit/e09c07c5070d59ac032baeff1ed253b5c00f4163))
* **web:** support markdown in notification messages ([90cbef7](https://github.com/unraid/api/commit/90cbef774962e9d8ede47df7a4c1ca06f2a6651b))
* **web:** update cache & view when archiving notifications ([08ab4d1](https://github.com/unraid/api/commit/08ab4d1a96c729c47feb868c10f398cad6dee5ba))
* **web:** use Markdown helper class to interact with markdown ([f9c2d35](https://github.com/unraid/api/commit/f9c2d353133b01e74fe1bfbc420df3980d944012))
* **web:** wip query api for notifications ([dec48b2](https://github.com/unraid/api/commit/dec48b2b0081362c5d0435eaabff1fb657d5f431))
* WIP create teleport composable ([20e795e](https://github.com/unraid/api/commit/20e795ed6921337ae7875b483f2ab94860b74797))
* wip Notification UI starter ([2f9e2ee](https://github.com/unraid/api/commit/2f9e2eef2db61221be66683caa4e75368aa475e0))
* WIP notifications w/ shadcn ([5a90b32](https://github.com/unraid/api/commit/5a90b3285ad8524cea58cbaca8293675b3dc257b))
* WIP sidebar filter select ([0c214fa](https://github.com/unraid/api/commit/0c214faaf69a69fc4da10a4a71b9c7cf7bd128c2))
* workflow changes ([c97bfb8](https://github.com/unraid/api/commit/c97bfb8794d779ef253236fbdb7bb9909f4dfbca))
* working ([29d7bd7](https://github.com/unraid/api/commit/29d7bd729bdfed79a3ce9c50014b3f1f32f9ac4e))
* wrap Notifications in a GraphQL Node & implement notification overviews ([bf89178](https://github.com/unraid/api/commit/bf89178cb7e359e73da8c8f27253734be982dcc8))
* zod config no longer any ([c32c5f5](https://github.com/unraid/api/commit/c32c5f57127b9469bde8806d78dc364562e73d9f))


### Bug Fixes

* 12 hour timestamp logic corrected ([03be43b](https://github.com/unraid/api/commit/03be43b4579f1dcf6a666a144f75b3063576748a))
* actually install dependencies ([0895420](https://github.com/unraid/api/commit/089542061294e354b0e63a9f41001b77c0d62fed))
* add another missing symlink ([4e7f3ff](https://github.com/unraid/api/commit/4e7f3ff4d9aa0e4af417a50e2b30537dda3c759c))
* add ecosystem config ([7dd5531](https://github.com/unraid/api/commit/7dd553174e1c3aaaf71380abfe57348f30815bde))
* add error check to nodejs ([c8e0fe8](https://github.com/unraid/api/commit/c8e0fe87a34d7f066b7d0900dda205a40616bfb6))
* add max var ([ed681e1](https://github.com/unraid/api/commit/ed681e1d27fb7fa13bc8cbb5238da06e453a7c3b))
* add return to resolver and update jsdoc for getNotifications ([a5e7d29](https://github.com/unraid/api/commit/a5e7d2956074376ef8e708b2bb7416cd2af3fe12))
* allow concurrent testing with a shared patcher instance ([623846e](https://github.com/unraid/api/commit/623846ef46eb24a32c62516de58e8bc5d0219833))
* always mangle ([e3a1eec](https://github.com/unraid/api/commit/e3a1eec5b62d010d05bb0908ba15fd8cb4f9d717))
* **api:** append time to formatted date when a custom date format is selected ([0ac8ed9](https://github.com/unraid/api/commit/0ac8ed9d9e7e239e471eedf466832aed0270d123))
* **api:** delay pm2 start until server has booted ([bd3188e](https://github.com/unraid/api/commit/bd3188efea4d3656994ffae32bd53f821c96358d))
* **api:** exclude duplicates from legacy script in archive retrieval ([8644e13](https://github.com/unraid/api/commit/8644e130979ed8740c5a8da0b3984266e2b3684c))
* **api:** improve defaults in PM2 service ([#1116](https://github.com/unraid/api/issues/1116)) ([57526de](https://github.com/unraid/api/commit/57526dede69e3a6547d05183e43c5b36dd1cae89))
* **api:** load dynamix config in the same way as the webgui ([2c4fd24](https://github.com/unraid/api/commit/2c4fd2419ce05a10c8543a7f679852b54df3d10f)), closes [/github.com/unraid/webgui/blob/95c6913c62e64314b985e08222feb3543113b2ec/emhttp/plugins/dynamix/include/Wrappers.php#L42](https://github.com/unraid//github.com/unraid/webgui/blob/95c6913c62e64314b985e08222feb3543113b2ec/emhttp/plugins/dynamix/include/Wrappers.php/issues/L42)
* **api:** make cookie recognition during websocket connection more ([353e012](https://github.com/unraid/api/commit/353e012db8ab5280863f32392c520b4a330c13cc))
* **api:** pm2 start script & limit auto restarts ([#1040](https://github.com/unraid/api/issues/1040)) ([ebcd347](https://github.com/unraid/api/commit/ebcd3479e735724626ffc6907c338d5080898bee))
* **api:** retry mothership connection up to 3x before logout ([#1069](https://github.com/unraid/api/issues/1069)) ([c27bb1b](https://github.com/unraid/api/commit/c27bb1be4c7a9ab201585586f3bc5e4afa1c7791))
* **api:** sanitize incoming user session id's ([f5e3424](https://github.com/unraid/api/commit/f5e3424b79702e8f959b5519e83370a9e1d2033b))
* **api:** slow init of unraid-api cli ([#1022](https://github.com/unraid/api/issues/1022)) ([5dbbae7](https://github.com/unraid/api/commit/5dbbae796792a62234497d056eac019aa084b21c))
* **api:** strip server id prefixes from graphql request variables ([326d054](https://github.com/unraid/api/commit/326d0540f0865735f220e0fc7c5822913a7865ea))
* **api:** update deploy-dev script to dist instead of src ([55cce09](https://github.com/unraid/api/commit/55cce09e65521762a6fe388d5b9b88ace1337c26))
* **api:** validate cookie session data ([491f680](https://github.com/unraid/api/commit/491f680607ce7244d9e47a457e44cde711fbe00c))
* apollo client lint issues ([a6d6dcc](https://github.com/unraid/api/commit/a6d6dcc2acc2b529c6f6821ce57865e521b84075))
* app running ([5f71670](https://github.com/unraid/api/commit/5f716701715595f93fd0bc63b92ecf02335daa41))
* apply and rollback error handling ([e22191b](https://github.com/unraid/api/commit/e22191bc77bc09f5c6c4ad57e5073829cf966ba4))
* attempt to restore upgradepkg if install failed ([19c2a79](https://github.com/unraid/api/commit/19c2a79ce6c31c989f3d7f70cf7d8e2c219517b2))
* authorization type error ([#987](https://github.com/unraid/api/issues/987)) ([7a4799e](https://github.com/unraid/api/commit/7a4799e9cd4caef6acfc3661d205a377fcf499ab))
* back to default configs ([b5711c9](https://github.com/unraid/api/commit/b5711c91284072991bcf409ac6126cd4b46afc7c))
* backup restore formatting ([15210f6](https://github.com/unraid/api/commit/15210f64b0938ec884a3ef4379d245c661eab9a3))
* basic test fixed ([2f38035](https://github.com/unraid/api/commit/2f38035520ca0fe796c981d08b9136d89ffc5888))
* better js file handling ([ddf160e](https://github.com/unraid/api/commit/ddf160e878a352842e813154b607945ccc7b4081))
* better loader functionality and error handling ([8a57d2d](https://github.com/unraid/api/commit/8a57d2dccbcb9c2effc5df5d8c69ad02713de24a))
* better logging when error ([6e4e3f8](https://github.com/unraid/api/commit/6e4e3f85abf64f8d799e33c33823810e71ef13e2))
* build issues based on removed code ([59c1d5a](https://github.com/unraid/api/commit/59c1d5a3f991c4e3625a8853ade17d2ca8936474))
* builder cache ([56771f6](https://github.com/unraid/api/commit/56771f6ee210297406d6bddff04de816ba0bb2d5))
* capitalize name ([31166b3](https://github.com/unraid/api/commit/31166b3483dc01847ad555618c43f8248411bdfa))
* changelog parser ([6fecec8](https://github.com/unraid/api/commit/6fecec8d4af3a4fccf2886791188711e1d2db77b))
* check width before changing viewport ([f07381b](https://github.com/unraid/api/commit/f07381b243501ecc6d54063881faad77a99a7655))
* cleaner logs for starting API ([79f26ef](https://github.com/unraid/api/commit/79f26ef251cb42e7f2106d00c6c05e2bf17b8227))
* cleanup commands ([052aea0](https://github.com/unraid/api/commit/052aea06a0d30963532f29f9961fce0ffc7fa3e8))
* clearer error messaging ([e373849](https://github.com/unraid/api/commit/e37384966c5b9079bb507052dcaba56232c1c42a))
* code review feedback ([c66079e](https://github.com/unraid/api/commit/c66079e9a8e0ef47e5054118d0581bec708ac604))
* completion script registration ([05c8c9b](https://github.com/unraid/api/commit/05c8c9bf078ece2061ad8ae32497f52b8c9b94dc))
* connect key role ([2dcfc1c](https://github.com/unraid/api/commit/2dcfc1c19a1d085df84f0b1b50c096e3220205dd))
* connect plugin location ([7867a93](https://github.com/unraid/api/commit/7867a932eb0bda43d3fb3613bdba227717510e4a))
* convert updateId function to iterative instead of recursive ([65c20d2](https://github.com/unraid/api/commit/65c20d210987bc4dbb19f3e200fffa655b5fe2f4))
* **CookieService:** potential race condition in unit tests ([1f2a380](https://github.com/unraid/api/commit/1f2a380b775adf44fdb3c85278fe0151584284f1))
* **cors:** excessive instantiation of CookieService to improve memory overhead ([28c553d](https://github.com/unraid/api/commit/28c553d4c8d7c744e2b5554b1254cdd2bfda5ff5))
* create api key for connect on startup ([58329bc](https://github.com/unraid/api/commit/58329bc29521ebc26b27ee20013ac3926c5088c2))
* create api key permissions ([cefb644](https://github.com/unraid/api/commit/cefb644bd7fa513f553ca0ca4c49f0fb42a74112))
* create connect key ([6b1ab7b](https://github.com/unraid/api/commit/6b1ab7b74ae1d2938fa9105180a5f66e9604fd41))
* cwd on ecosystem.config.json ([dfd0da4](https://github.com/unraid/api/commit/dfd0da4ca23078f6de2e54d5e5bd6cba06334abc))
* dark theme as array ([1021d0d](https://github.com/unraid/api/commit/1021d0da0d7a919dedec70656bb52775575aa9e7))
* default overwrite false test ([cf59107](https://github.com/unraid/api/commit/cf59107e568d91be684176335db5300bee9be865))
* delete .original files ([a9eb21a](https://github.com/unraid/api/commit/a9eb21aac0f373990aaa3f7a99731612540533cf))
* delete boot script and update nvmrc ([ecd6b44](https://github.com/unraid/api/commit/ecd6b443c7dee8c5c5dee959f9ff3ace192204c7))
* delete unused line ([de4882e](https://github.com/unraid/api/commit/de4882ea17f54e788049cc5bb96b99b16822b6b4))
* delete upgradepkg ([74f0177](https://github.com/unraid/api/commit/74f0177ba0fd57722caa3ec14318d35167d3c6f7))
* deprecated  version warning ([89d0bd2](https://github.com/unraid/api/commit/89d0bd2e6da35fb1e8d95627d38edb54f82e0c6b))
* **deps:** update apollo graphql packages ([7b1ee99](https://github.com/unraid/api/commit/7b1ee9940cca46e563bb79c7056996315f9decc5))
* **deps:** update dependency @apollo/client to v3.12.6 ([22ce615](https://github.com/unraid/api/commit/22ce61574f862eac4cdf8c00141bfbf1ac948055))
* **deps:** update dependency @apollo/client to v3.12.6 ([bb7800a](https://github.com/unraid/api/commit/bb7800a8c088705fd8310671a9896cbe9b0184e5))
* **deps:** update dependency @apollo/client to v3.12.9 ([6607cf2](https://github.com/unraid/api/commit/6607cf20c10a091d466c6a8031eebc17feb3e3fc))
* **deps:** update dependency @floating-ui/dom to v1.6.13 ([08798d2](https://github.com/unraid/api/commit/08798d2f77683412807d684d7a8e63f1aadb0c34))
* **deps:** update dependency @floating-ui/dom to v1.6.13 ([4d4c218](https://github.com/unraid/api/commit/4d4c218ac78e82a18679ec7b4939523db032b99b))
* **deps:** update dependency @floating-ui/vue to v1.1.6 ([b4b7d89](https://github.com/unraid/api/commit/b4b7d898b62f746180b7f5730b5d9b5033dcecc2))
* **deps:** update dependency @floating-ui/vue to v1.1.6 ([4c07d38](https://github.com/unraid/api/commit/4c07d389523f277950b8d2d359102f889587e5ce))
* **deps:** update dependency @graphql-tools/load-files to v7.0.1 ([4e5c724](https://github.com/unraid/api/commit/4e5c7242e43cc356f1c69adcfcd25b57896af476))
* **deps:** update dependency @nestjs/schedule to v4.1.2 ([faf0de5](https://github.com/unraid/api/commit/faf0de5a19256efb83dc45a484e3cba65596ccd7))
* **deps:** update dependency chokidar to v4.0.3 ([d63a93c](https://github.com/unraid/api/commit/d63a93c55004d17b6d17634c55ffbc5670ebbec7))
* **deps:** update dependency dotenv to v16.4.7 ([c66a650](https://github.com/unraid/api/commit/c66a6502b027853046d126a14ddee870ffabd10c))
* **deps:** update dependency execa to v9.5.2 ([d487c90](https://github.com/unraid/api/commit/d487c90ccc20162c76f0cdf49a736c1fee4271bd))
* **deps:** update dependency express to v4.21.2 ([a070306](https://github.com/unraid/api/commit/a07030684c8777e47eb4a51be0ea680b7f217e74))
* **deps:** update dependency focus-trap to v7.6.4 ([41ff232](https://github.com/unraid/api/commit/41ff232a3232dda66e5cdc2d4808a820a90a5d34))
* **deps:** update dependency focus-trap to v7.6.4 ([f0e3038](https://github.com/unraid/api/commit/f0e3038ee7426aafb6cef01b85b47893c2238302))
* **deps:** update dependency got to v14.4.5 ([975a47c](https://github.com/unraid/api/commit/975a47c7d47841c49443f46264feb54abf53698c))
* **deps:** update dependency graphql-ws to v5.16.2 ([a189a03](https://github.com/unraid/api/commit/a189a0308a734e66750fe5059f7c59d8c9532bd8))
* **deps:** update dependency graphql-ws to v5.16.2 ([25d8f08](https://github.com/unraid/api/commit/25d8f085b67c2e53876d837c739214dc874116b8))
* **deps:** update dependency ini to v4.1.3 ([4c88cbe](https://github.com/unraid/api/commit/4c88cbee4b2d5f6717241dadac23bfe90ce15193))
* **deps:** update dependency node-window-polyfill to v1.0.4 ([8bfa88f](https://github.com/unraid/api/commit/8bfa88f4bc932eb82dd9b33a494811ea15764758))
* **deps:** update dependency openid-client to v6.1.7 ([0f50517](https://github.com/unraid/api/commit/0f50517a8544e1eb9b08ad1b3f05f798491b7f23))
* **deps:** update dependency p-retry to v6.2.1 ([c6f3241](https://github.com/unraid/api/commit/c6f324155019e066701723a57b642c6e3ba8332d))
* **deps:** update dependency pm2 to v5.4.3 ([a754090](https://github.com/unraid/api/commit/a75409026dd4e3d9ed120802012b67b179327448))
* **deps:** update dependency radix-vue to v1.9.12 ([0fd433f](https://github.com/unraid/api/commit/0fd433fe2a6b3f787624cb5a98efeae0f6c31cfd))
* **deps:** update dependency radix-vue to v1.9.13 ([249feff](https://github.com/unraid/api/commit/249feff5cfe0bbb60bfa8f943b76b9c16c6c161b))
* **deps:** update dependency uuid to v11.0.5 ([7e3398b](https://github.com/unraid/api/commit/7e3398b2efabf1a5407d6e20c165eb4923b3bab2))
* **deps:** update graphql-tools monorepo ([cd7e2fe](https://github.com/unraid/api/commit/cd7e2feea199276a1d431cf355e54e12e5960d9a))
* **deps:** update graphqlcodegenerator monorepo ([0446c59](https://github.com/unraid/api/commit/0446c5924a6a9dd15b875628ca0f1197cfe521c4))
* **deps:** update graphqlcodegenerator monorepo ([15c789d](https://github.com/unraid/api/commit/15c789dbb34b85bed55c2731fb8ae8260f5f311f))
* **deps:** update nest monorepo to v10.4.15 ([07b1ea9](https://github.com/unraid/api/commit/07b1ea9a10634a597909ae1d237cc3b1e7f959b7))
* **deps:** update nest-graphql monorepo to v12.2.2 ([91aabd9](https://github.com/unraid/api/commit/91aabd9ffbfb8c2ceb4110217dfc05de8859077d))
* detection script path bin instead of sbin ([7138fd2](https://github.com/unraid/api/commit/7138fd297abc1435f61e7e4c8f4a5a91662c64f0))
* dev mode ([fd64e01](https://github.com/unraid/api/commit/fd64e01e0c87db03fc2d4d0f32a0e8205fbe8b84))
* disable permissions bypass to avoid incorrect role assignment to api keys ([343489e](https://github.com/unraid/api/commit/343489e52c526757c1449a6f5074def50e73a380))
* dnserr on new line ([a3398a2](https://github.com/unraid/api/commit/a3398a29e15269be006e887fba6366c81b1d00f5))
* do not process.exit on restart or stop command ([933575f](https://github.com/unraid/api/commit/933575fc2badbb09b3a9d3c66724e37a9ee246f2))
* docker formatting and build mkdir issues ([f447739](https://github.com/unraid/api/commit/f447739585e8ed8449653802c1f0d4d11d6c65de))
* don't check code for execa ([508a5eb](https://github.com/unraid/api/commit/508a5eb49d9514dca9953317d9fa93314fe63e4c))
* don't LS in the release folder ([ab9d969](https://github.com/unraid/api/commit/ab9d9695394a300d6b0799e9b644dd5d0f969d72))
* dont remove login file without a backup presetn ([0370e4f](https://github.com/unraid/api/commit/0370e4f7ea3e3df0d2264264324d8e53ffc0c086))
* downgrade marked to fix changelog preview issue ([cfb3a45](https://github.com/unraid/api/commit/cfb3a45533d3c1bd31c44094f7ae2912e77a673e))
* edit settings padding issue ([adf349b](https://github.com/unraid/api/commit/adf349b76560b5f1fd4c320da35b3c6f660895fb))
* ensure directory exists before making connect key ([9e27ec9](https://github.com/unraid/api/commit/9e27ec98b68a49bdd6dc4b03de8c0cc3a1470a5e))
* env correct ([9929856](https://github.com/unraid/api/commit/99298566382313f1da9c374dbec3652c1b2812d3))
* env input ([c182c06](https://github.com/unraid/api/commit/c182c06d9443597521eaacd2052d905e0138cac4))
* EOF ([25ac1b5](https://github.com/unraid/api/commit/25ac1b5f0772d3ce63d47eb8a1dc640be125b68b))
* eslint config ([b28a605](https://github.com/unraid/api/commit/b28a605300cee1e9ce1f5db3a165b4d0d2080316))
* excess spacing in api-key.service ([1deb002](https://github.com/unraid/api/commit/1deb0023287a39d40e52e89c515a28e62352f62c))
* execa upgrade snapshots fixed ([d8244f7](https://github.com/unraid/api/commit/d8244f7aac02dd97c756a9784391cd661f3536ba))
* extra log line ([1183063](https://github.com/unraid/api/commit/1183063aa7063afd8222def18f5e1fd6077e8c88))
* extra spacing in config.ts ([f3ee7be](https://github.com/unraid/api/commit/f3ee7be80f2c60266fbb13597a70f0a389fb577f))
* file modification service fixes ([aa5b3f4](https://github.com/unraid/api/commit/aa5b3f4e47ed88df23af00dfcccb7b64786b6231))
* find by key, not ID ([3c3fa1e](https://github.com/unraid/api/commit/3c3fa1e27cfabbe6926c3da8870751397eed1def))
* floating-ui fixes ([1c3b43b](https://github.com/unraid/api/commit/1c3b43b4464662e1a1b21695e601cd7f7e4fd734))
* forced restarting on commands ([925866d](https://github.com/unraid/api/commit/925866d389e337fcb8c249ead929e1f65854465b))
* format authrequest mod as other files ([180a81d](https://github.com/unraid/api/commit/180a81dbae8e749eae237fc8cee2950c790eedf0))
* formatting issue ([42ca969](https://github.com/unraid/api/commit/42ca9691f7547a4340501863c1882efc0aee4c60))
* further resolve sso sub ids issues ([ef3d0ea](https://github.com/unraid/api/commit/ef3d0ead687d4a6071da290c0df29c12163303e1))
* handle special chars better ([d364bb1](https://github.com/unraid/api/commit/d364bb1fc4c042469ce4b0ca6001a807d0b002da))
* improve typing and format lookup ([c6097f8](https://github.com/unraid/api/commit/c6097f86e42fcc57209c1344029abe854198edca))
* initial feedback about report addressed ([5dee09c](https://github.com/unraid/api/commit/5dee09c77ad375de2eca59f650e5fea2070087b5))
* install as-integrations/fastify ([ff4546d](https://github.com/unraid/api/commit/ff4546d6692d2a4799f2dbeef0d5e5c6bac62561))
* install syntax error ([ec83480](https://github.com/unraid/api/commit/ec83480eb6aea09b98b9135516dc1fc8cdd6c692))
* integration of `unraid-ui` tailwind config in `web` ([#1074](https://github.com/unraid/api/issues/1074)) ([f3cd85b](https://github.com/unraid/api/commit/f3cd85bd3f02bdbe4c44136189d1c61935015844))
* invalid type ([e13794f](https://github.com/unraid/api/commit/e13794f8e56081335ebc16b00a2f8631f9639909))
* length ([83579f1](https://github.com/unraid/api/commit/83579f1fbd03ffe929d009c20d214b4de62835c6))
* lint ([0f218b8](https://github.com/unraid/api/commit/0f218b8b72e397734823efab8f2141973a3a80ce))
* lint ([82bca54](https://github.com/unraid/api/commit/82bca54c594265ddf23a298691bd7ef6d4b47f32))
* lint ([ceb443d](https://github.com/unraid/api/commit/ceb443da15d177a950c36af61b93a7126cf4ca85))
* lint ([da04e7c](https://github.com/unraid/api/commit/da04e7ce0873d7802a936952d91e9867f0868a6e))
* lint ([7d87f0e](https://github.com/unraid/api/commit/7d87f0eee23dfa0f391fd342d38ed9084f18d8d4))
* lint issues ([48e482b](https://github.com/unraid/api/commit/48e482b913d4f27f49ae669c7c19dc0714d3c0c7))
* linter error ([6dba28d](https://github.com/unraid/api/commit/6dba28dd1bbe0125f842271eeae9daf54826b063))
* load builder image to cache ([5497bc3](https://github.com/unraid/api/commit/5497bc3235bd3c8b427b3418a7be2e3ece4c4abc))
* load notifications from file system instead of redux state ([53a37cd](https://github.com/unraid/api/commit/53a37cd1d20bb2b738bdeda832a42196d662b8a4))
* load PM2 from node_modules ([5a07e8c](https://github.com/unraid/api/commit/5a07e8cae5ce9ced9980a9df950d053196edf65b))
* local variable assignment ([f7d9ccc](https://github.com/unraid/api/commit/f7d9ccc0820f0fe8efa55b1c2d75f79819c764c4))
* logging location ([572b922](https://github.com/unraid/api/commit/572b922f4d72759a5ed7d06ddfa4af3bfb655c6b))
* logrotate error ([8c64dd2](https://github.com/unraid/api/commit/8c64dd2f2c65aa83ce0e2d501357ee595c976e56))
* lowercase or ([386cbde](https://github.com/unraid/api/commit/386cbdef5c9158290e03c670efb992cf11d5af1b))
* make cli.js executable ([644db0e](https://github.com/unraid/api/commit/644db0ef3315b00361524ea0fe440083f35088a0))
* marked single input ([ceacbbe](https://github.com/unraid/api/commit/ceacbbe5d46466627df0fccc5ca8e7c56fa36a37))
* missing ip-regex module ([fde7202](https://github.com/unraid/api/commit/fde720264bf395c0047356c3084878c8878aadfa))
* missing server type ([f1b721b](https://github.com/unraid/api/commit/f1b721bd72b875d9ff8c0bca2cc1eee506ba7697))
* mock ensureDirSync ([7e012e6](https://github.com/unraid/api/commit/7e012e6a2eb96ccddf5a1f69d7580b4bdfe7a0a9))
* more color work ([c48f826](https://github.com/unraid/api/commit/c48f8268def64ef8828dea556360b375b8cb32c7))
* more filename fixes and PR var passing ([088dbed](https://github.com/unraid/api/commit/088dbed9b2fabfaf55b003fb1fa9c10c558f21d5))
* more generic test ([0f651db](https://github.com/unraid/api/commit/0f651dbf61a1822b492aa80030f0bc231bc6f606))
* more verbose logging for node install to find issues ([445af0c](https://github.com/unraid/api/commit/445af0c147ef641dac05ebeb2d44e63e8a4df799))
* mv paths() to top of NotificationsService to make it more intuitive ([7138568](https://github.com/unraid/api/commit/713856818dfaf7d7f5807eacc3b7d61561888082))
* no more node_dl_server ([77779a6](https://github.com/unraid/api/commit/77779a655f18e9d474ad8a7e61c8ef51090a49d8))
* no nodehost ([6787ec7](https://github.com/unraid/api/commit/6787ec7d65ecef27652ca48193fe64f2ea82ca4e))
* no vite-node in non-dev mode ([023f73f](https://github.com/unraid/api/commit/023f73f3992b42f60aa56d8dd51a5e698c140306))
* node install process improvements ([b8540dd](https://github.com/unraid/api/commit/b8540ddeb888678edd24db31a6747583761d5aa9))
* node_txz naming ([b7c24ca](https://github.com/unraid/api/commit/b7c24ca861e92bf01118a17bc7e2322063e6a800))
* **NotificationItem:** icon & text alignment in header ([98716f7](https://github.com/unraid/api/commit/98716f70a6a2c29610e1ed7cda1aedad5065134d))
* **NotificationService:** file watcher initialization ([b7e3f8e](https://github.com/unraid/api/commit/b7e3f8e42ae4bf488228503b4e5234b1e7a38180))
* **NotificationsService:** edge-case in deleteAllNotifications by adding fs-extra package ([fef763a](https://github.com/unraid/api/commit/fef763a3298b9bf4aae2e18db4722637ce9bd7e4))
* **NotificationsSidebar:** occupy full viewport on small screens ([1f81fb8](https://github.com/unraid/api/commit/1f81fb8b92bef102b0b7d2daf562c9b4e296473e))
* oauth2 api prefix ([ec00add](https://github.com/unraid/api/commit/ec00adde20d4d9eca28f6b18615073305f491a73))
* only instantiate service one time ([933dc81](https://github.com/unraid/api/commit/933dc81b6c50db5a33f586f7094e1ea524b9a9fa))
* only test if API was changed ([5871143](https://github.com/unraid/api/commit/5871143b809d6a6784e949e20212599a54afc71f))
* only test when API is changed ([ddea0e8](https://github.com/unraid/api/commit/ddea0e8e11816c58e5b50cb611e5796fbca3fecf))
* only toast unread notifications, not archived ones ([cc59be6](https://github.com/unraid/api/commit/cc59be6cb3efc71226ee50f9f04e37a2e4b50de6))
* padding and glob function issues ([1d3f2eb](https://github.com/unraid/api/commit/1d3f2eb8213115c3385ac2d29ee8f53560347ba8))
* pass env through to docker ([200be38](https://github.com/unraid/api/commit/200be384f9dec86a1e77f46a0e6a336e86ba7563))
* pass ssoSubIds only ([5adf13e](https://github.com/unraid/api/commit/5adf13ee070bdcd849339460b9888e51d224e765))
* pass token to password field ([499b023](https://github.com/unraid/api/commit/499b023d359ed5181450ee9e04cbbf4531a4a680))
* patch-utils unused ([047808d](https://github.com/unraid/api/commit/047808dce0cd9e9b4b273a9124dbd45ca9446208))
* paths now correct, better download logic ([16db2d9](https://github.com/unraid/api/commit/16db2d908dcb2c65508b367712c51bf9872a95e5))
* pkg_build ([d4bff0e](https://github.com/unraid/api/commit/d4bff0ee96e6e0974978465573e72e68d09fd829))
* plugin download route and add env node to cli script ([78bd982](https://github.com/unraid/api/commit/78bd9820200a0996d9b8c5f718a97c20ed4feab4))
* PR build missing files ([57f9b95](https://github.com/unraid/api/commit/57f9b95134be5c3dd8053f57f82e91a0e0622d3e))
* production env for web build ([b4107f6](https://github.com/unraid/api/commit/b4107f6c4d4db47d7331f4b3d30a4ace724a8f0e))
* proper directory in rc.unraid-api ([a3add5a](https://github.com/unraid/api/commit/a3add5ae165b09dd695a2ddabf6131ac8700825f))
* proper file replacements ([e0042f3](https://github.com/unraid/api/commit/e0042f353b47cfa72a485d6a58ad0b956ea6dbc2))
* properly log error with template string ([3781f1f](https://github.com/unraid/api/commit/3781f1f41c7f0eef604daee0402ed9a2bb27cd46))
* properly restart the API when installed ([765593a](https://github.com/unraid/api/commit/765593a3da1e3b8bee1ae6c8aa1d9d0f2498d41c))
* pull node version directly from nvmrc ([b2e6948](https://github.com/unraid/api/commit/b2e694881218c08765b26ada08ed6ab325177b1e))
* pull token from query not params ([2e827e7](https://github.com/unraid/api/commit/2e827e7cabe4a6a069d4e8779015e5896d8a1d1d))
* race condition when updating notification types ([f048f56](https://github.com/unraid/api/commit/f048f566627e91947cc98550412ca68d728c52c7))
* re-add type-check ([60e9d1d](https://github.com/unraid/api/commit/60e9d1d912c983cf04e3e6cf15e221c39938612a))
* recreate package-lock to fix issues ([ad5a537](https://github.com/unraid/api/commit/ad5a53793d25ac9f63bae6df6c2a30d8d2780c67))
* remove console log ([8e75b82](https://github.com/unraid/api/commit/8e75b8254bbda93ded786750226090b769bed5c4))
* remove console logs with vue plugin ([2b2e923](https://github.com/unraid/api/commit/2b2e9236ce55cfc3ca10f708ed08e09dcfd402d1))
* remove devDependencies from output package json ([294869b](https://github.com/unraid/api/commit/294869bbea7f8a1863f8aafae6b074330e057679))
* remove extra space ([a99ee03](https://github.com/unraid/api/commit/a99ee03fc37059b3a018db289c43fc419a634524))
* remove isNaN in favor of number.isNaN ([03e3a46](https://github.com/unraid/api/commit/03e3a46092db613281176b88cae284f6448027c6))
* remove line from or in button ([1a1bce7](https://github.com/unraid/api/commit/1a1bce7b64b1cf90505f811e11b585ff87476f72))
* remove memory key generation ([b84db13](https://github.com/unraid/api/commit/b84db1322104c7f26f7b6378f25a2757b3010c6d))
* remove uneeded env variable ([f688a35](https://github.com/unraid/api/commit/f688a350d3d0a1c47be5896e6fbf92eeb8433967))
* remove unused constructor ([e0e2a7b](https://github.com/unraid/api/commit/e0e2a7b41c5e599ed4cf3bf49c7faea3b71f0b70))
* remove unused date-fns ([fe94ef5](https://github.com/unraid/api/commit/fe94ef5ba88df56aad87089081dd5fe4518fa414))
* remove unused disableProductionConsoleLogs call ([691661b](https://github.com/unraid/api/commit/691661b952394e61a1b79c41419745fbf6caba20))
* remove unused imports ([65c1891](https://github.com/unraid/api/commit/65c18917563745cab9711e9900086e90ab44e284))
* remove unused job dependency ([84533d8](https://github.com/unraid/api/commit/84533d8fa56dc19635ea33d79bd8e644e539edd2))
* remove unused login entries ([7833b5d](https://github.com/unraid/api/commit/7833b5db386f724318857fc31d825fb3534c84b9))
* remove usage of Role.UPC ([d1e2f6e](https://github.com/unraid/api/commit/d1e2f6e0b391cb4eca75a0997b41cb99a9953d42))
* render function fixed ([8008ab4](https://github.com/unraid/api/commit/8008ab46fb2f231b68201758a258fd43e2e1672e))
* replace express cookie parser with fastify's ([0acebb0](https://github.com/unraid/api/commit/0acebb0dd25e919f3cc132eb7f96927992fc4151))
* report issues + pm2 issues ([28c383e](https://github.com/unraid/api/commit/28c383e1d111d4ac4226d7d966533ba80ca5d9a1))
* reset config to be closer to default ([b7fbb0b](https://github.com/unraid/api/commit/b7fbb0b6af0453f5f6a17087bb7e68c393b9fe3f))
* resource busy when removing all subdirectories ([29936c9](https://github.com/unraid/api/commit/29936c90938fb83bc2f154315ca63a9d7cc98552))
* restart command elegant ([296117b](https://github.com/unraid/api/commit/296117b51aac8a4c15366f2271af858868b6e071))
* restore upgradepkg before install ([fddca27](https://github.com/unraid/api/commit/fddca2738c0ec016e744169d88b35a55dea092fa))
* revert changes to indicator.vue ([84d2a83](https://github.com/unraid/api/commit/84d2a832c0f64e52be05670eb438b21bff2e5163))
* revert myservers.cfg ([d0896f3](https://github.com/unraid/api/commit/d0896f3ef8aebdd9c76d805ed6a35b4a5d5a1b08))
* rm getServerIdentifier wrapping Notifications id ([eaea306](https://github.com/unraid/api/commit/eaea306d54f633f563c7340f8a992e03b631f903))
* rm rf to fix build issues ([a27cbe0](https://github.com/unraid/api/commit/a27cbe00d813ede6f31d4824fd63ff29a1ef6972))
* sandbox defaults in dev mode wrong ([2a24919](https://github.com/unraid/api/commit/2a2491936cf85013be836450ab7ed0cc11207e11))
* sequential test execution for generic-modification ([79ee1f7](https://github.com/unraid/api/commit/79ee1f7552cee47c6f5a8eb5942468292212e2f2))
* shell path to unraid-api ([15d11e4](https://github.com/unraid/api/commit/15d11e477bb2a08d785a7b22bd51900279a55508))
* staging build issues ([e6bcb8d](https://github.com/unraid/api/commit/e6bcb8de7daee463f7ac0dbf977e085e108302ba))
* start command simplification ([e1faf3a](https://github.com/unraid/api/commit/e1faf3aa8db5973eb1bb0ea7a4844f820504618d))
* stop command exits ([2dbfdb6](https://github.com/unraid/api/commit/2dbfdb670a773114c0fdc68c7cf9d29fa4e28a9b))
* strip components from tar line ([911cd5b](https://github.com/unraid/api/commit/911cd5bc0b0983df4ca8c9057bea5166f7d1c7f1))
* subdependenies ([f1ad3b0](https://github.com/unraid/api/commit/f1ad3b0af13345189e10973b422f4e5c6b5d7839))
* swap to flexible IDs in tests ([b95559d](https://github.com/unraid/api/commit/b95559d9a1e743f92bc3b776892286e8d7abfc1e))
* swap to placeholder key ([d1864d0](https://github.com/unraid/api/commit/d1864d0020ed56ab2368d23b48604b55cff21ae4))
* switch to useToggle ([848233f](https://github.com/unraid/api/commit/848233f05465053876ac6f9f6ac4bfad2a48abff))
* test issues ([e4b55b1](https://github.com/unraid/api/commit/e4b55b133bb2dc4bf2ccfd6fd2fc244daadbea53))
* test simplification to ensure no redownloads ([e07dad3](https://github.com/unraid/api/commit/e07dad3a6947aa186c4ac03032b5b3813cd046b6))
* tests ([25c1c1a](https://github.com/unraid/api/commit/25c1c1a55a3fb32b76bf5cb7257a4ba44f717a89))
* tests and validate token clears screen ([7f48ddd](https://github.com/unraid/api/commit/7f48dddcd2e2ea1ae3a55ecc54d5ac274535b714))
* text classes ([1e17cfc](https://github.com/unraid/api/commit/1e17cfc2bca5e8431188804b28f4645eb42cdc9f))
* theme store now uses singular variables object ([5ca6e40](https://github.com/unraid/api/commit/5ca6e40b2d4942385b12a4325d6b8a551cb3f44b))
* thorw on invalid token body ([f1af763](https://github.com/unraid/api/commit/f1af763eaf0dd8215eed470293d3a7f98784f38a))
* trigger loading correctly ([e18f3d3](https://github.com/unraid/api/commit/e18f3d3e566011054163ec7827494fa047b26ec9))
* type & build errors ([800969a](https://github.com/unraid/api/commit/800969a87a45d1d3ca9eca65657fddeccba66f28))
* type error on element render ([a2563eb](https://github.com/unraid/api/commit/a2563eb8e710a9ac7259c4260cad9a3454565dae))
* type for generic test ([e856535](https://github.com/unraid/api/commit/e85653592a9d6eadcd0be89bf90a96c5d313fda3))
* unit test failure ([fed165e](https://github.com/unraid/api/commit/fed165eab0358fe032a99e5afbdb19813b00b741))
* unit test issues ([c58f7a7](https://github.com/unraid/api/commit/c58f7a7f246902c7d354eb51d1c87c8ea3b636a3))
* unit tests updated ([9548505](https://github.com/unraid/api/commit/954850535bec6b09aaf66b01d3ee749c8a22de5d))
* unneeded await on api-key service ([0325be7](https://github.com/unraid/api/commit/0325be757ee4c04b5c23365ff592f521a492595b))
* unraid-api in usr/bin ([580babd](https://github.com/unraid/api/commit/580babdafddd89ee2fb0b07aa7f5dff865be37d2))
* unused import ([83fbea5](https://github.com/unraid/api/commit/83fbea5632b1de71afa4d0ca3224a946bf76fd23))
* unused imports ([a5447aa](https://github.com/unraid/api/commit/a5447aa2f4c99968651fa3750d6bf0e8d68678de))
* unused node dl line ([7ea1c3a](https://github.com/unraid/api/commit/7ea1c3a8f24e47f2e10994ffe629135dc4614159))
* upc header text color ([f989026](https://github.com/unraid/api/commit/f9890260d1c4abe69dac3ac4c05ebab17aab5161))
* update tests ([d0696a9](https://github.com/unraid/api/commit/d0696a93810893ccd6c676df1c639ca279992428))
* upgradepkg ([90cf1a8](https://github.com/unraid/api/commit/90cf1a8eea67d3dbc736ecdfba47e0025b1dc31c))
* use an enum and defaults for sandbox value ([eb56483](https://github.com/unraid/api/commit/eb56483ba2693944d39f4409c91b75ee82a7d30b))
* use batchProcess ([ffbb9d7](https://github.com/unraid/api/commit/ffbb9d7750568bfa849d21e051503d1fcca5355f))
* use correct ini encoder in notification service ([d1f8c61](https://github.com/unraid/api/commit/d1f8c61f1b9ea5745acdfd2d60de4725b4dffe05))
* use cwd when running application ([e016652](https://github.com/unraid/api/commit/e01665264b6f45366cdacf60c0f3553adfbd85d3))
* use foreground text color for UPC ([87b8165](https://github.com/unraid/api/commit/87b816550d413dc9023c5057efe18b9cb26761e7))
* use placeholder in test API key ([c6b7755](https://github.com/unraid/api/commit/c6b7755214de8bedd5c0f2735473c2a559b1e26f))
* use unraid binary path to call unraid commands ([555087d](https://github.com/unraid/api/commit/555087dcdd2bc9e5a6f2ccbdaff30a1bc89ad712))
* used TGZ instead of TXZ for nghttp3 ([09ad394](https://github.com/unraid/api/commit/09ad39483fed7a8155176b6568114b4e6679d587))
* variable naming ([dbffc0d](https://github.com/unraid/api/commit/dbffc0d293cefcb8d923cbcb17ad1f1a1d5e302d))
* variables passed properly ([e0875e7](https://github.com/unraid/api/commit/e0875e7a1b273969939d6902a55f4a9772640078))
* version and EOF key ([cafa47d](https://github.com/unraid/api/commit/cafa47d283d9b637c1e8dfbd7407186e58233358))
* watch all events to load keys ([59ca177](https://github.com/unraid/api/commit/59ca17787e4d36113b0a8c5ef2117acfc491c49c))
* **web:** add default values to optional vue component props ([d3092e4](https://github.com/unraid/api/commit/d3092e487ead2ca4647928008ee54f3cd6b333c2))
* **web:** dedupe incoming notifications during cache merge ([4a40729](https://github.com/unraid/api/commit/4a40729e3721d01ac45614f4b7d1c48aec483cbc))
* **web:** display error message in sidebar when api is offline ([#984](https://github.com/unraid/api/issues/984)) ([125c0a1](https://github.com/unraid/api/commit/125c0a140b4e9b5401bacf1addab1820c412917e))
* **web:** edge case where archived notifications don't appear ([0a8c574](https://github.com/unraid/api/commit/0a8c5746fc2b8f8639643f013c1f19f0d7236d41))
* **web:** env var typo ([22cf90b](https://github.com/unraid/api/commit/22cf90b27fadec3024d9d038c53683e8f8a723bc))
* **web:** escaping html-encoded symbols like apostrophes in translations ([#1002](https://github.com/unraid/api/issues/1002)) ([04a3362](https://github.com/unraid/api/commit/04a33621e1d406d75ed0ff9af9f1f945813a1e8d))
* **web:** flash of disconnected api state on page load ([a8c02f4](https://github.com/unraid/api/commit/a8c02f4c49433b440a6f9c70f269bf69076655dc))
* **web:** infinite scroll loop when there's only 1 page of notifications ([e9f2fc4](https://github.com/unraid/api/commit/e9f2fc424c350d07c756ae7573e90f615bcae25b))
* **web:** infinite trigger at bottom of infinite scroll ([eb691d3](https://github.com/unraid/api/commit/eb691d3514d8dc079987bfa566de4aa86094ef67))
* **web:** inline shadcn variables into tailwind config to simplify build ([07fd7fe](https://github.com/unraid/api/commit/07fd7fe120f42ddf15c19f2a7df135fb9741187b))
* **web:** notification styles & alignment ([#968](https://github.com/unraid/api/issues/968)) ([0d65e12](https://github.com/unraid/api/commit/0d65e12cede3324261fd3b219745b1e7793a33de))
* **web:** refetch notifications for sidebar when new notifications arrive ([591bf4a](https://github.com/unraid/api/commit/591bf4a643ccc13c151c0a8cafad833d3137043e))
* **web:** remove unused infinite-scroll emit from SheetContent ([95db23f](https://github.com/unraid/api/commit/95db23f8e13574a50e0ba3860bbfd54fd663c20e))
* **web:** remove warn and error console log removal ([#1086](https://github.com/unraid/api/issues/1086)) ([9375639](https://github.com/unraid/api/commit/9375639e4a71ecfe8d4b877301c1f9bb22800a72))
* **web:** replace incorrect custom types with codegen from gql & update values to match expected shapes ([fc93ef8](https://github.com/unraid/api/commit/fc93ef8e32607c807f9bd8529088a69937bdaefc))
* **web:** replace manual height hack in notifications infinite scroll ([de1e272](https://github.com/unraid/api/commit/de1e272357264afc0f7f5fdd653c6a865105d710))
* **web:** reset infinite scroll when notification filters change ([da6de2c](https://github.com/unraid/api/commit/da6de2ccdb710772a199c8cba8952adc247412db))
* **web:** sanitize changelog markup after parsing ([c960292](https://github.com/unraid/api/commit/c96029273283f5970a5029eea1d7f451bbd0071b))
* **web:** stop opening notification sidebar to archive tab ([325e75f](https://github.com/unraid/api/commit/325e75f5d444908a2227fbe2e94be9ab5196ad8e))
* **web:** theme header differences ([#1085](https://github.com/unraid/api/issues/1085)) ([1ccdd8d](https://github.com/unraid/api/commit/1ccdd8dc71ee5e1e3aacabd113d1cf213ca7c7ae))
* **web:** track 'notification seen' state across tabs & page loads ([#1121](https://github.com/unraid/api/issues/1121)) ([64cf6ec](https://github.com/unraid/api/commit/64cf6ecc6aec25cd8edee5659efb09f288bb9908))
* **web:** update unread total immediately upon archiving ([#982](https://github.com/unraid/api/issues/982)) ([ff5fd8e](https://github.com/unraid/api/commit/ff5fd8e5eb8eb4803db1265e31b0c1352af20251))

## [3.11.0](https://github.com/unraid/api/compare/v3.10.1...v3.11.0) (2024-09-11)


### Features

* reduce how often rc.flashbackup checks for changes ([793d368](https://github.com/unraid/api/commit/793d3681404018e0ae933df0ad111809220ad138))
* send api_version to flash/activate endpoint ([d8ec20e](https://github.com/unraid/api/commit/d8ec20ea6aa35aa241abd8424c4d884bcbb8f590))
* update ProvisionCert.php to clean hosts file when it runs ([fbe20c9](https://github.com/unraid/api/commit/fbe20c97b327849c15a4b34f5f53476edaefbeb6))


### Bug Fixes

* remove local flash backup ratelimit file on uninstall/update ([abf207b](https://github.com/unraid/api/commit/abf207b077861798c53739b1965207f87d5633b3))

### [3.10.1](https://github.com/unraid/api/compare/v3.10.0...v3.10.1) (2024-09-03)

## [3.10.0](https://github.com/unraid/api/compare/v3.9.0...v3.10.0) (2024-09-03)


### Features

* add a timestamp to flash backup ([#877](https://github.com/unraid/api/issues/877)) ([b868fd4](https://github.com/unraid/api/commit/b868fd46c3886b2182245a61f20be6df65e46abe))
* add environment to docker-compose ([2ee4683](https://github.com/unraid/api/commit/2ee46839095e3b8ee287cfe10f29ae9a39dcff68))
* add global agent ([#897](https://github.com/unraid/api/issues/897)) ([8b0dc69](https://github.com/unraid/api/commit/8b0dc69f65bd3e280a21c50aab221334f7341b1c))
* add logrotate to cron in nestjs ([#839](https://github.com/unraid/api/issues/839)) ([5c91524](https://github.com/unraid/api/commit/5c91524d849147c0ac7925f3a2f1cce67ffe75de))
* add new staging url for connect website ([#841](https://github.com/unraid/api/issues/841)) ([4cfc07b](https://github.com/unraid/api/commit/4cfc07b6763dbb79b68cf01f7eaf7cf33370d4db))
* add support for expiration in var.ini ([#833](https://github.com/unraid/api/issues/833)) ([0474c2e](https://github.com/unraid/api/commit/0474c2e14fa462d2e1ec6d9a7f974660385d073e))
* always show DRA even if disabled ([ab708c0](https://github.com/unraid/api/commit/ab708c0df634e21bf81595412d7de0be3ff7c392))
* close log on exit ([d6ede86](https://github.com/unraid/api/commit/d6ede86eca6301342cdf35bf1f9365896b5e5009))
* create stable hash based on apikey rather than hostname ([ecf5554](https://github.com/unraid/api/commit/ecf5554e304cc7dee78cb1f206ef4e80222c3e64))
* disable all legacy dashboard and network logic ([6784f4b](https://github.com/unraid/api/commit/6784f4b6e1a12b2f30bfa9ab4fe6310994bd18ae))
* dynamic remote access using remote queries ([f7fc0c4](https://github.com/unraid/api/commit/f7fc0c431561978054d2ff37d1aa644865e846ec))
* extraOrigins public, remove origin listener ([91f96ba](https://github.com/unraid/api/commit/91f96ba818773d6e71dde1ff52a4c8ec21ba6b5d))
* fix codegen ([d0bf5bb](https://github.com/unraid/api/commit/d0bf5bb8197b11f7a250ca5392890184a1dbeff7))
* fix exit hook and cleanup docker scripts ([#758](https://github.com/unraid/api/issues/758)) ([a9ff73e](https://github.com/unraid/api/commit/a9ff73e0a04c67e9ec9d5551cf0b1f124be6f381))
* fix logging format on start and stop ([c6720c3](https://github.com/unraid/api/commit/c6720c331df055480d2d65b37290f4978fe429da))
* local start command ([99b6007](https://github.com/unraid/api/commit/99b6007ba30353084a8bea54cc0e782fcc1bfea4))
* log config recreation reason ([f36c72f](https://github.com/unraid/api/commit/f36c72f5ad44b7e41d1726fa181dc2b9f594c72c))
* move dynamic remote access to be fully api controlled ([206eb6b](https://github.com/unraid/api/commit/206eb6b74aa83047237e5f6c94c46b08c6507168))
* move FQDN urls to a generic parser ([#899](https://github.com/unraid/api/issues/899)) ([246595e](https://github.com/unraid/api/commit/246595ee7acd8370906a759cbe618def4f52c173))
* nestjs initial query implementation ([#748](https://github.com/unraid/api/issues/748)) ([075d7f2](https://github.com/unraid/api/commit/075d7f25785bf686779b7fee1d5ea39f09ff3ea8))
* new key types in API ([e42f9dc](https://github.com/unraid/api/commit/e42f9dc95be03e8389aac443f2147c07a316d48d))
* regTy swapped ([564b25c](https://github.com/unraid/api/commit/564b25cf5ce0a62d40f8d63d44c81e9c8560e0be))
* remove dashboard resolver completely in favor of direct field resolvers ([1cd1ee5](https://github.com/unraid/api/commit/1cd1ee534825ccf775208c438ae0bd777bbe4d39))
* remove dashboard types ([2f0167d](https://github.com/unraid/api/commit/2f0167dc89835bcf8aa946425c5c6683221fd763))
* run codegen and update build script ([07512ad](https://github.com/unraid/api/commit/07512adc13ee0d819db45ff6c5c5f58a0ba31141))
* settings through the API ([#867](https://github.com/unraid/api/issues/867)) ([e73624b](https://github.com/unraid/api/commit/e73624be6be8bc2c70d898b8601a88cc8d20a3e4))
* swap to docker compose from docker-compose ([ec16a6a](https://github.com/unraid/api/commit/ec16a6aab1a2d5c836387da438fbeade07d23425))
* swap to fragement usage on webcomponent ([42733ab](https://github.com/unraid/api/commit/42733abf6e443516ff715569333422ce80d3b1d2))
* update tests and snapshots ([c39aa17](https://github.com/unraid/api/commit/c39aa17e4302ed56b3097ab3244d840f11eb686b))
* upgrade a ton of dependencies ([#842](https://github.com/unraid/api/issues/842)) ([94c1746](https://github.com/unraid/api/commit/94c174620c2347a3cf3d100404635f99a5b47287))


### Bug Fixes

* add serverName / description to dashboard payload ([9677aff](https://github.com/unraid/api/commit/9677aff1cd0942f36a2845f3f105601c494efd9e))
* allow failure for log deletion ([eff3142](https://github.com/unraid/api/commit/eff31423927644be436a831126678719c2eb0621))
* allowed origins check not working without spaces ([#838](https://github.com/unraid/api/issues/838)) ([b998b38](https://github.com/unraid/api/commit/b998b38355fab77ecc2f62bc64896766218db3d4))
* **api:** readme discord url ([ffd5c6a](https://github.com/unraid/api/commit/ffd5c6afb64956e76df22c77104a21bc22798008))
* build docker command updated to use dc.sh script ([0b40886](https://github.com/unraid/api/commit/0b40886e84f27a94dbf67ef4ca0cd8539ef3913e))
* codegen on web run ([e2e67c2](https://github.com/unraid/api/commit/e2e67c21067a138d963f5f10760b84cf6a533542))
* **deps:** update dependency @apollo/client to v3.9.5 ([#785](https://github.com/unraid/api/issues/785)) ([75b98bc](https://github.com/unraid/api/commit/75b98bc1cbca5b66ae72f52a0b6f5f58230a2473))
* **deps:** update dependency graphql to v16.8.1 ([bff1b19](https://github.com/unraid/api/commit/bff1b19706bee1e3103e3a0a1d2fceb3154f9bba))
* **deps:** update dependency graphql-ws to v5.15.0 ([#790](https://github.com/unraid/api/issues/790)) ([4773b13](https://github.com/unraid/api/commit/4773b132167d740d4c996efe22e0f1b99576fb9b))
* **deps:** update dependency ws to v8.16.0 ([#815](https://github.com/unraid/api/issues/815)) ([212020e](https://github.com/unraid/api/commit/212020e78d4de0576137058a3374837b4a43e02d))
* **deps:** update dependency wtfnode to v0.9.3 ([#901](https://github.com/unraid/api/issues/901)) ([a88482b](https://github.com/unraid/api/commit/a88482bfcbf134f55330f8728bc5c7f67c521773))
* **deps:** update graphql-tools monorepo ([3447eb0](https://github.com/unraid/api/commit/3447eb047a1dcd575b88a96bbcef9946aca366a1))
* **deps:** update graphql-tools monorepo (major) ([#693](https://github.com/unraid/api/issues/693)) ([3447eb0](https://github.com/unraid/api/commit/3447eb047a1dcd575b88a96bbcef9946aca366a1))
* **deps:** update nest monorepo ([#816](https://github.com/unraid/api/issues/816)) ([4af3699](https://github.com/unraid/api/commit/4af36991b8b376f816ed51fd503a66e99675a3e7))
* excessive logging ([89cb254](https://github.com/unraid/api/commit/89cb2544ed0e0edd33b59f15d487487e22c0ae32))
* exit with process.exit not process.exitcode ([dcb6def](https://github.com/unraid/api/commit/dcb6def1cf3365dca819feed101160c8ad0125dc))
* lint ([919873d](https://github.com/unraid/api/commit/919873d9edee304d99036a4a810db3789c734fbf))
* local container startup commands cleaned up ([6c0ccb2](https://github.com/unraid/api/commit/6c0ccb2b24f98282be4db2e0b2e6362f4a187def))
* logrotate not working due to invalid ownership of unraid-api folder ([ec0581a](https://github.com/unraid/api/commit/ec0581abf58a217f698d52d5337f2b312e5a645b))
* optional check on api.version to allow fallback to save value ([0ac4455](https://github.com/unraid/api/commit/0ac4455f78407eca7aa1d6ee360830067a1c5c3e))
* permission for dashboard payload ([704a530](https://github.com/unraid/api/commit/704a530653dac415766bded5e96f6060f931e591))
* rearrange exit hook to try to fix closing ([843d3f4](https://github.com/unraid/api/commit/843d3f41162c5dbcfd7803912b1879d7a182231a))
* revert myservers.cfg to fix test ([a7705be](https://github.com/unraid/api/commit/a7705beb0a5b32660367ad8de9b46b06f7a3bec7))
* run hourly ([0425794](https://github.com/unraid/api/commit/0425794356a01262222e7dff2645d3629e00d0f6))
* unused import ([065fe57](https://github.com/unraid/api/commit/065fe575f578a74d593805c3121dd7fbdfc3e5ae))
* update snapshots ([c8a0a8e](https://github.com/unraid/api/commit/c8a0a8ec007abc0372464c7e2b44bd47b6babd94))

## [3.9.0](https://github.com/unraid/api/compare/api-v3.8.1...api-v3.9.0) (2024-09-03)


### Features

* add a timestamp to flash backup ([#877](https://github.com/unraid/api/issues/877)) ([b868fd4](https://github.com/unraid/api/commit/b868fd46c3886b2182245a61f20be6df65e46abe))
* add environment to docker-compose ([2ee4683](https://github.com/unraid/api/commit/2ee46839095e3b8ee287cfe10f29ae9a39dcff68))
* add global agent ([#897](https://github.com/unraid/api/issues/897)) ([8b0dc69](https://github.com/unraid/api/commit/8b0dc69f65bd3e280a21c50aab221334f7341b1c))
* add logrotate to cron in nestjs ([#839](https://github.com/unraid/api/issues/839)) ([5c91524](https://github.com/unraid/api/commit/5c91524d849147c0ac7925f3a2f1cce67ffe75de))
* add new staging url for connect website ([#841](https://github.com/unraid/api/issues/841)) ([4cfc07b](https://github.com/unraid/api/commit/4cfc07b6763dbb79b68cf01f7eaf7cf33370d4db))
* add support for expiration in var.ini ([#833](https://github.com/unraid/api/issues/833)) ([0474c2e](https://github.com/unraid/api/commit/0474c2e14fa462d2e1ec6d9a7f974660385d073e))
* always show DRA even if disabled ([ab708c0](https://github.com/unraid/api/commit/ab708c0df634e21bf81595412d7de0be3ff7c392))
* close log on exit ([d6ede86](https://github.com/unraid/api/commit/d6ede86eca6301342cdf35bf1f9365896b5e5009))
* create stable hash based on apikey rather than hostname ([ecf5554](https://github.com/unraid/api/commit/ecf5554e304cc7dee78cb1f206ef4e80222c3e64))
* disable all legacy dashboard and network logic ([6784f4b](https://github.com/unraid/api/commit/6784f4b6e1a12b2f30bfa9ab4fe6310994bd18ae))
* dynamic remote access using remote queries ([f7fc0c4](https://github.com/unraid/api/commit/f7fc0c431561978054d2ff37d1aa644865e846ec))
* extraOrigins public, remove origin listener ([91f96ba](https://github.com/unraid/api/commit/91f96ba818773d6e71dde1ff52a4c8ec21ba6b5d))
* fix codegen ([d0bf5bb](https://github.com/unraid/api/commit/d0bf5bb8197b11f7a250ca5392890184a1dbeff7))
* fix exit hook and cleanup docker scripts ([#758](https://github.com/unraid/api/issues/758)) ([a9ff73e](https://github.com/unraid/api/commit/a9ff73e0a04c67e9ec9d5551cf0b1f124be6f381))
* fix logging format on start and stop ([c6720c3](https://github.com/unraid/api/commit/c6720c331df055480d2d65b37290f4978fe429da))
* local start command ([99b6007](https://github.com/unraid/api/commit/99b6007ba30353084a8bea54cc0e782fcc1bfea4))
* log config recreation reason ([f36c72f](https://github.com/unraid/api/commit/f36c72f5ad44b7e41d1726fa181dc2b9f594c72c))
* move dynamic remote access to be fully api controlled ([206eb6b](https://github.com/unraid/api/commit/206eb6b74aa83047237e5f6c94c46b08c6507168))
* move FQDN urls to a generic parser ([#899](https://github.com/unraid/api/issues/899)) ([246595e](https://github.com/unraid/api/commit/246595ee7acd8370906a759cbe618def4f52c173))
* nestjs initial query implementation ([#748](https://github.com/unraid/api/issues/748)) ([075d7f2](https://github.com/unraid/api/commit/075d7f25785bf686779b7fee1d5ea39f09ff3ea8))
* new key types in API ([e42f9dc](https://github.com/unraid/api/commit/e42f9dc95be03e8389aac443f2147c07a316d48d))
* regTy swapped ([564b25c](https://github.com/unraid/api/commit/564b25cf5ce0a62d40f8d63d44c81e9c8560e0be))
* remove dashboard resolver completely in favor of direct field resolvers ([1cd1ee5](https://github.com/unraid/api/commit/1cd1ee534825ccf775208c438ae0bd777bbe4d39))
* remove dashboard types ([2f0167d](https://github.com/unraid/api/commit/2f0167dc89835bcf8aa946425c5c6683221fd763))
* run codegen and update build script ([07512ad](https://github.com/unraid/api/commit/07512adc13ee0d819db45ff6c5c5f58a0ba31141))
* settings through the API ([#867](https://github.com/unraid/api/issues/867)) ([e73624b](https://github.com/unraid/api/commit/e73624be6be8bc2c70d898b8601a88cc8d20a3e4))
* swap to docker compose from docker-compose ([ec16a6a](https://github.com/unraid/api/commit/ec16a6aab1a2d5c836387da438fbeade07d23425))
* swap to fragement usage on webcomponent ([42733ab](https://github.com/unraid/api/commit/42733abf6e443516ff715569333422ce80d3b1d2))
* update tests and snapshots ([c39aa17](https://github.com/unraid/api/commit/c39aa17e4302ed56b3097ab3244d840f11eb686b))
* upgrade a ton of dependencies ([#842](https://github.com/unraid/api/issues/842)) ([94c1746](https://github.com/unraid/api/commit/94c174620c2347a3cf3d100404635f99a5b47287))


### Bug Fixes

* add serverName / description to dashboard payload ([9677aff](https://github.com/unraid/api/commit/9677aff1cd0942f36a2845f3f105601c494efd9e))
* allow failure for log deletion ([eff3142](https://github.com/unraid/api/commit/eff31423927644be436a831126678719c2eb0621))
* allowed origins check not working without spaces ([#838](https://github.com/unraid/api/issues/838)) ([b998b38](https://github.com/unraid/api/commit/b998b38355fab77ecc2f62bc64896766218db3d4))
* **api:** readme discord url ([ffd5c6a](https://github.com/unraid/api/commit/ffd5c6afb64956e76df22c77104a21bc22798008))
* build docker command updated to use dc.sh script ([0b40886](https://github.com/unraid/api/commit/0b40886e84f27a94dbf67ef4ca0cd8539ef3913e))
* codegen on web run ([e2e67c2](https://github.com/unraid/api/commit/e2e67c21067a138d963f5f10760b84cf6a533542))
* **deps:** update dependency @apollo/client to v3.9.5 ([#785](https://github.com/unraid/api/issues/785)) ([75b98bc](https://github.com/unraid/api/commit/75b98bc1cbca5b66ae72f52a0b6f5f58230a2473))
* **deps:** update dependency graphql to v16.8.1 ([bff1b19](https://github.com/unraid/api/commit/bff1b19706bee1e3103e3a0a1d2fceb3154f9bba))
* **deps:** update dependency graphql-ws to v5.15.0 ([#790](https://github.com/unraid/api/issues/790)) ([4773b13](https://github.com/unraid/api/commit/4773b132167d740d4c996efe22e0f1b99576fb9b))
* **deps:** update dependency ws to v8.16.0 ([#815](https://github.com/unraid/api/issues/815)) ([212020e](https://github.com/unraid/api/commit/212020e78d4de0576137058a3374837b4a43e02d))
* **deps:** update dependency wtfnode to v0.9.3 ([#901](https://github.com/unraid/api/issues/901)) ([a88482b](https://github.com/unraid/api/commit/a88482bfcbf134f55330f8728bc5c7f67c521773))
* **deps:** update graphql-tools monorepo ([3447eb0](https://github.com/unraid/api/commit/3447eb047a1dcd575b88a96bbcef9946aca366a1))
* **deps:** update graphql-tools monorepo (major) ([#693](https://github.com/unraid/api/issues/693)) ([3447eb0](https://github.com/unraid/api/commit/3447eb047a1dcd575b88a96bbcef9946aca366a1))
* **deps:** update nest monorepo ([#816](https://github.com/unraid/api/issues/816)) ([4af3699](https://github.com/unraid/api/commit/4af36991b8b376f816ed51fd503a66e99675a3e7))
* excessive logging ([89cb254](https://github.com/unraid/api/commit/89cb2544ed0e0edd33b59f15d487487e22c0ae32))
* exit with process.exit not process.exitcode ([dcb6def](https://github.com/unraid/api/commit/dcb6def1cf3365dca819feed101160c8ad0125dc))
* lint ([919873d](https://github.com/unraid/api/commit/919873d9edee304d99036a4a810db3789c734fbf))
* local container startup commands cleaned up ([6c0ccb2](https://github.com/unraid/api/commit/6c0ccb2b24f98282be4db2e0b2e6362f4a187def))
* logrotate not working due to invalid ownership of unraid-api folder ([ec0581a](https://github.com/unraid/api/commit/ec0581abf58a217f698d52d5337f2b312e5a645b))
* optional check on api.version to allow fallback to save value ([0ac4455](https://github.com/unraid/api/commit/0ac4455f78407eca7aa1d6ee360830067a1c5c3e))
* permission for dashboard payload ([704a530](https://github.com/unraid/api/commit/704a530653dac415766bded5e96f6060f931e591))
* rearrange exit hook to try to fix closing ([843d3f4](https://github.com/unraid/api/commit/843d3f41162c5dbcfd7803912b1879d7a182231a))
* revert myservers.cfg to fix test ([a7705be](https://github.com/unraid/api/commit/a7705beb0a5b32660367ad8de9b46b06f7a3bec7))
* run hourly ([0425794](https://github.com/unraid/api/commit/0425794356a01262222e7dff2645d3629e00d0f6))
* unused import ([065fe57](https://github.com/unraid/api/commit/065fe575f578a74d593805c3121dd7fbdfc3e5ae))
* update snapshots ([c8a0a8e](https://github.com/unraid/api/commit/c8a0a8ec007abc0372464c7e2b44bd47b6babd94))

### [3.8.1](https://github.com/unraid/api/compare/v3.8.0...v3.8.1) (2024-08-13)

## [3.8.0](https://github.com/unraid/api/compare/v3.7.1...v3.8.0) (2024-08-13)


### Features

* always force push ([662f3ce](https://github.com/unraid/api/commit/662f3ce440593e609c64364726f7da16dda0972b))
* don't allow flash backup repos larger than 500MB ([#890](https://github.com/unraid/api/issues/890)) ([30a32f5](https://github.com/unraid/api/commit/30a32f5fe684bb32c084c4125aade5e63ffd788b))
* downgradeOs callback for non stable osCurrentBranch ([17c4489](https://github.com/unraid/api/commit/17c4489e97bda504ca45e360591655ded166c355))
* settings through the API ([#867](https://github.com/unraid/api/issues/867)) ([e73624b](https://github.com/unraid/api/commit/e73624be6be8bc2c70d898b8601a88cc8d20a3e4))
* swap to docker compose from docker-compose ([ec16a6a](https://github.com/unraid/api/commit/ec16a6aab1a2d5c836387da438fbeade07d23425))


### Bug Fixes

* apolloClient types ([f14c767](https://github.com/unraid/api/commit/f14c7673735b92aa167e9e8dcb14a045bcfea994))
* **deps:** update dependency @vue/apollo-composable to v4.0.2 ([#787](https://github.com/unraid/api/issues/787)) ([edfc846](https://github.com/unraid/api/commit/edfc8464b0e0c2f38003ae8420e81532fd18351f))
* formattedRegTm type ([748906e](https://github.com/unraid/api/commit/748906e15d30c6162e2f08f28724c9104c81d123))
* i18n t prop type ([96d519f](https://github.com/unraid/api/commit/96d519f3e6b96ea7c4dc60616522216de20ee140))
* lint error for web components ([bc27b20](https://github.com/unraid/api/commit/bc27b20524934cf896efb84a131cd270431c508c))
* lint issues ([853dc19](https://github.com/unraid/api/commit/853dc195b13fff29160afb44f9ff11d4dd6a3232))
* swap undefined to null ([ebba976](https://github.com/unraid/api/commit/ebba9769873a6536e3fce65978e6475d93280560))
* tailwind config types ([0f77e55](https://github.com/unraid/api/commit/0f77e5596db3356b5dc05129b3ce215a8809e1dc))
* ts-expect-error unneeded ([ee4d4e9](https://github.com/unraid/api/commit/ee4d4e9f12b4488ff39445bc72c1b83a9d93e993))
* type check ([606aad7](https://github.com/unraid/api/commit/606aad703d91b72a14e15da3100dfa355052ed58))
* type errors round 1 ([977d5da](https://github.com/unraid/api/commit/977d5daf04012f16e7b6602167338f0bc363735a))
* update status button alignment ([4f2deaf](https://github.com/unraid/api/commit/4f2deaf70e5caa9f29fc5b2974b278f80b7b3a8a))

### [3.7.1](https://github.com/unraid/api/compare/v3.7.0...v3.7.1) (2024-05-15)


### Bug Fixes

* reboot required and available edge case ([#885](https://github.com/unraid/api/issues/885)) ([76e9cdf](https://github.com/unraid/api/commit/76e9cdf81f06a19c2e4c9a40a4d8e062bad2a607))

## [3.7.0](https://github.com/unraid/api/compare/v3.6.0...v3.7.0) (2024-05-14)


### Features

* add a timestamp to flash backup ([#877](https://github.com/unraid/api/issues/877)) ([b868fd4](https://github.com/unraid/api/commit/b868fd46c3886b2182245a61f20be6df65e46abe))
* add support for outgoing proxies ([#863](https://github.com/unraid/api/issues/863)) ([223693e](https://github.com/unraid/api/commit/223693e0981d5f2884a1f8b8baf03d4dc58e8cb2))
* array state on registration page ([d36fef0](https://github.com/unraid/api/commit/d36fef0545ddb820e67e8bc6cb42ea3644021d66))
* downgradeOs callback ([154a976](https://github.com/unraid/api/commit/154a976109f0a32653a2851988420707631327ca))
* Flash Backup requires connection to mothership ([#868](https://github.com/unraid/api/issues/868)) ([d127208](https://github.com/unraid/api/commit/d127208b5e0f7f9991f515f95b0e266d38cf3287))
* **plg:** install prevent downgrade of shared page & php files ([#873](https://github.com/unraid/api/issues/873)) ([4ac72b1](https://github.com/unraid/api/commit/4ac72b16692c4246c9d2c0b53b23d8b2d95f5de6))
* **plg:** plg install prevent web component downgrade ([8703bd4](https://github.com/unraid/api/commit/8703bd498108f5c05562584a708bd2306e53f7a6))
* postbuild script to add timestamp to web component manifest ([47f08ea](https://github.com/unraid/api/commit/47f08ea3594a91098f67718c0123110c7b5f86f7))
* registration page server error heading + subheading ([6038ebd](https://github.com/unraid/api/commit/6038ebdf39bf47f2cb5c0b1de84764795374f018))
* remove cron to download JS daily ([#864](https://github.com/unraid/api/issues/864)) ([33f6d6b](https://github.com/unraid/api/commit/33f6d6b343de07dbe70de863926906736d42f371)), closes [#529](https://github.com/unraid/api/issues/529)
* ui to allow second update without reboot ([b0f2d10](https://github.com/unraid/api/commit/b0f2d102917f54ab33f0ad10863522b8ff8e3ce5))
* UI Update OS Cancel ([7c02308](https://github.com/unraid/api/commit/7c02308964d5e21990427a2c626c9db2d9e1fed0))
* UnraidUpdateCancel script ([b73bdc0](https://github.com/unraid/api/commit/b73bdc021764762ed12dca494e1345412a45c677))
* **web:** callback types myKeys & linkKey ([c88ee01](https://github.com/unraid/api/commit/c88ee01827396c3fa8a30bb88c4be712c80b1f4f))
* **web:** Registration key linked to account status ([8f6182d](https://github.com/unraid/api/commit/8f6182d426453b73aa19c5f0f59469fa07571694))
* **web:** registration page array status messaging ([23ef5a9](https://github.com/unraid/api/commit/23ef5a975e0d5ff0c246c2df5e6c2cb38979d12a))


### Bug Fixes

* **api:** readme discord url ([ffd5c6a](https://github.com/unraid/api/commit/ffd5c6afb64956e76df22c77104a21bc22798008))
* keep minor enhancements from [#872](https://github.com/unraid/api/issues/872) ([#878](https://github.com/unraid/api/issues/878)) ([94a5aa8](https://github.com/unraid/api/commit/94a5aa87b9979fe0f02f884ac61298473bb3271a))
* plugin file deployment script ([780d87d](https://github.com/unraid/api/commit/780d87d6589a5469f47ac3fdfd50610ecfc394c8))
* prevent corrupt case model in state.php ([#874](https://github.com/unraid/api/issues/874)) ([4ad31df](https://github.com/unraid/api/commit/4ad31dfea9192146dbd2c90bc64a913c696ab0b7))
* prevent local dev from throwing ssl error ([051f647](https://github.com/unraid/api/commit/051f6474becf3b25b242cdc6ceee67247b79f8ba))
* rc.flashbackup needs to check both signed in and connected ([#882](https://github.com/unraid/api/issues/882)) ([ac8068c](https://github.com/unraid/api/commit/ac8068c9b084622d46fe2c9cb320b793c9ea8c52))
* update os cancel refresh on update page ([213c16b](https://github.com/unraid/api/commit/213c16ba3d5a84ebf4965f9d2f4024c66605a613))
* **web:** discord url ([1a6f4c6](https://github.com/unraid/api/commit/1a6f4c6db4ef0e5eefac467ec6583b14cb3546c4))
* **web:** lint unused rebootVersion ([e198ec9](https://github.com/unraid/api/commit/e198ec9d458e262c412c2dcb5a9d279238de1730))
* **web:** registration component remove unused ref ([76f556b](https://github.com/unraid/api/commit/76f556bd64b95ba96af795c9edfa045ebdff4444))

## [3.6.0](https://github.com/unraid/api/compare/v3.5.3...v3.6.0) (2024-03-26)


### Features

* server config enum message w/ ineligible support ([#861](https://github.com/unraid/api/issues/861)) ([4d3a351](https://github.com/unraid/api/commit/4d3a3510777090788573f4cee83694a0dc6f8df5))

### [3.5.3](https://github.com/unraid/api/compare/v3.5.2...v3.5.3) (2024-03-25)


### Bug Fixes

* regDevs usage to allow more flexibility for STARTER ([#860](https://github.com/unraid/api/issues/860)) ([92a9600](https://github.com/unraid/api/commit/92a9600f3a242c5f263f1672eab81054b9cf4fae))

### [3.5.2](https://github.com/unraid/api/compare/v3.5.1...v3.5.2) (2024-03-06)


### Bug Fixes

* **deps:** update dependency vue-i18n to v9.10.1 ([#813](https://github.com/unraid/api/issues/813)) ([69b599c](https://github.com/unraid/api/commit/69b599c5ed8d44864201a32b4d952427d454dc74))
* **deps:** update dependency wretch to v2.8.0 ([#814](https://github.com/unraid/api/issues/814)) ([66900b4](https://github.com/unraid/api/commit/66900b495b82b923264897d38b1529a22b10aa1c))
* update os check modal button conditionals ([282a836](https://github.com/unraid/api/commit/282a83625f417ccefe090b65cc6b73a084727a87))
* update os check modal ineligible date format ([83083de](https://github.com/unraid/api/commit/83083de1e698f73a35635ae6047dcf49fd4b8114))

### [3.5.1](https://github.com/unraid/api/compare/v3.5.0...v3.5.1) (2024-02-29)


### Bug Fixes

* build docker command updated to use dc.sh script ([0b40886](https://github.com/unraid/api/commit/0b40886e84f27a94dbf67ef4ca0cd8539ef3913e))
* date format in UnraidCheck.php ([#852](https://github.com/unraid/api/issues/852)) ([6465f2d](https://github.com/unraid/api/commit/6465f2d7b2394090f35e29cdd680d98ce37f3728))
* **deps:** update dependency @apollo/client to v3.9.5 ([#785](https://github.com/unraid/api/issues/785)) ([75b98bc](https://github.com/unraid/api/commit/75b98bc1cbca5b66ae72f52a0b6f5f58230a2473))
* **deps:** update dependency @heroicons/vue to v2.1.1 ([#804](https://github.com/unraid/api/issues/804)) ([a0eb7ee](https://github.com/unraid/api/commit/a0eb7ee3ec459dbe1992a7f85bf194da30395a74))
* **deps:** update dependency focus-trap to v7.5.4 ([#788](https://github.com/unraid/api/issues/788)) ([fe000e8](https://github.com/unraid/api/commit/fe000e83825e82cac558d3277664a440e59c0e4a))
* **deps:** update dependency graphql-ws to v5.15.0 ([#790](https://github.com/unraid/api/issues/790)) ([4773b13](https://github.com/unraid/api/commit/4773b132167d740d4c996efe22e0f1b99576fb9b))
* display dropdown for pro key no connect installed ([#848](https://github.com/unraid/api/issues/848)) ([b559604](https://github.com/unraid/api/commit/b55960429895b46627f1cd3ed1683ee527e62944))
* dropdown reboot link text ([#849](https://github.com/unraid/api/issues/849)) ([a8ed5e5](https://github.com/unraid/api/commit/a8ed5e5628bc71fb783a03c3db92d21805243738))
* os updates rc to stable ([bf1bd88](https://github.com/unraid/api/commit/bf1bd887d60ac085bf4aeae90f11be3b45ee1182))
* state connect values without connect installed ([e47de6c](https://github.com/unraid/api/commit/e47de6c2c5db7a2a1a9b24099feb02023b3a7bbf))
* state php breaking with double quotes in server description ([c6e92aa](https://github.com/unraid/api/commit/c6e92aa3157c9fe9e7b83580881ebcc1cbd03658))
* state php special chars for html attributes ([#853](https://github.com/unraid/api/issues/853)) ([dd4139c](https://github.com/unraid/api/commit/dd4139cf1a7ae5c6f9b00111c33ae124bb17e630))
* unraid-api missing start command + var defaults ([ceb4c58](https://github.com/unraid/api/commit/ceb4c587d20c7527f2b36a3278c310b0e657bfba))
* unraid-api.php $param1 fallback ([909c79c](https://github.com/unraid/api/commit/909c79c8c82500aea1a0d4d00766f788103c5fe3))

## [3.5.0](https://github.com/unraid/api/compare/v3.4.0...v3.5.0) (2024-02-07)


### Features

* add manage account link to all versions of upc dropdown ([678e620](https://github.com/unraid/api/commit/678e620c1902a376b1866265711d5722b4119d8e))
* add new staging url for connect website ([#841](https://github.com/unraid/api/issues/841)) ([4cfc07b](https://github.com/unraid/api/commit/4cfc07b6763dbb79b68cf01f7eaf7cf33370d4db))
* also ship to cloudflare ([#844](https://github.com/unraid/api/issues/844)) ([41c4210](https://github.com/unraid/api/commit/41c42103685209592b272f81a877702da04d0915))
* button add underline-hover-red style option ([f2fa5fa](https://github.com/unraid/api/commit/f2fa5fa49675ef461330be7b7eb3e3e4106983b0))
* changelog modal ([2ddbacd](https://github.com/unraid/api/commit/2ddbacd137cc5748244c3d25ac91f82e64d77f99))
* check update response modal ([39678f0](https://github.com/unraid/api/commit/39678f0bb0ddc5f87ea7f5ed80a0472100ea8b5d))
* create WebguiCheckForUpdate endpoint ([41d546e](https://github.com/unraid/api/commit/41d546eea5fcf6593d7b5047274c074bb89c1802))
* getOsReleaseBySha256 cached endpoint with keyfile header ([cd2413a](https://github.com/unraid/api/commit/cd2413abe8c5baab40e4e5974e08a5d18dce8e0d))
* new check update buttons in dropdown ([ef5fcb9](https://github.com/unraid/api/commit/ef5fcb96a324143da864df803acaa0da1cd00eb7))
* ship preview to different bucket ([#845](https://github.com/unraid/api/issues/845)) ([8e5d247](https://github.com/unraid/api/commit/8e5d247bca83d9e50977c9b16b212841ac9f70ad))
* ship production to different bucket ([#846](https://github.com/unraid/api/issues/846)) ([63c0875](https://github.com/unraid/api/commit/63c08758c76425e007b1779bb2f77b75bc45896e))
* unraidcheck callable from webgui with altUrl & json output ([ba8a67e](https://github.com/unraid/api/commit/ba8a67edfa043f442b11724227129f8d3f6cae0a))
* update modals ([8ad7d8b](https://github.com/unraid/api/commit/8ad7d8be9437e0caa0409da8f7322050919fbbaa))
* update os ignore release ([1955eb2](https://github.com/unraid/api/commit/1955eb23a3cdc30f0a67bc5950a047f83a860d99))
* update os notifications enabled usage + link to enable & more options to account app ([5c82aff](https://github.com/unraid/api/commit/5c82aff80dc7e6d8f4b23e52af29abc2b8576424))
* updateOs check response determines if update auth is required ([a9816d9](https://github.com/unraid/api/commit/a9816d9ad48ff80d87b5aeb236ff60c4979ad298))
* updateOs store call local server-side endpoint & add modal support ([be48447](https://github.com/unraid/api/commit/be48447f943828af281095c5a092ac686e729030))
* upgrade a ton of dependencies ([#842](https://github.com/unraid/api/issues/842)) ([94c1746](https://github.com/unraid/api/commit/94c174620c2347a3cf3d100404635f99a5b47287))
* WebguiCheckForUpdate using server-side check ([590deb1](https://github.com/unraid/api/commit/590deb130c301d4004fecdc211270583806b5593))


### Bug Fixes

* backport _var() PHP function to older versions of Unraid ([f53150e](https://github.com/unraid/api/commit/f53150e1fa33b3f45b66ad0dc5eaabc470564d45))
* changlog relative links and external links ([a789e20](https://github.com/unraid/api/commit/a789e204ce7b966e6c935923626538ac344aeefe))
* check update response modal expired key button styles ([92993e3](https://github.com/unraid/api/commit/92993e3e0b6240c83a6a64efedd8ddb3be3f9ef7))
* **deps:** update dependency ws to v8.16.0 ([#815](https://github.com/unraid/api/issues/815)) ([212020e](https://github.com/unraid/api/commit/212020e78d4de0576137058a3374837b4a43e02d))
* extraLinks when no updates available ([853a991](https://github.com/unraid/api/commit/853a9911e3fd7eec9bbc88468de78f87b448d477))
* ignore release localStorage ([62c45ec](https://github.com/unraid/api/commit/62c45ec9d7c68498bbcfe933a5b63e4759c7129c))
* lint ([83235f9](https://github.com/unraid/api/commit/83235f9db726f4582b9d353a66f2f5e8925b8e34))
* lint unused value ([2c7e53b](https://github.com/unraid/api/commit/2c7e53bf67d1f214201624b39786bfb7de6aa520))
* marked-base-url install ([416ba71](https://github.com/unraid/api/commit/416ba716aa750a094e8cd521a79f6deebcd37864))
* missing translations ([faf17e4](https://github.com/unraid/api/commit/faf17e41e81c11443bc062d8ce35a33d9ae9ebbc))
* regTm format after key install without page refresh ([f3ddb31](https://github.com/unraid/api/commit/f3ddb31f994de9192f7203698ecc5d7de673c6a3))
* regTm format when already set ([5ad911f](https://github.com/unraid/api/commit/5ad911f8133daa60de53da738d41c6a59e2f02cc))
* ServerUpdateOsResponse type ([78bdae8](https://github.com/unraid/api/commit/78bdae86c907142d3ee32d6715eaa8f5a974a1ed))
* State Class usage in other files ([4ad7f53](https://github.com/unraid/api/commit/4ad7f53ec145b2e6d2895619523e90c1daa3f68f))
* state data humanReadable switch fallthrus ([9144e39](https://github.com/unraid/api/commit/9144e39d39aa56af0ad897735d1a3545330920d0))
* state php usage from cli ([46fd321](https://github.com/unraid/api/commit/46fd321707c14cd1f265ee806f673500d87132dd))
* translations ([3fabd57](https://github.com/unraid/api/commit/3fabd5756674c06fa803729cf13d19c592d8d46a))
* type issue with changlelog modal visibility ([e3c3f6b](https://github.com/unraid/api/commit/e3c3f6bf0f1882788291db17bd74865fefc3abf6))

## [3.4.0](https://github.com/unraid/api/compare/v3.3.0...v3.4.0) (2024-01-11)


### Features

* add logrotate to cron in nestjs ([#839](https://github.com/unraid/api/issues/839)) ([5c91524](https://github.com/unraid/api/commit/5c91524d849147c0ac7925f3a2f1cce67ffe75de))


### Bug Fixes

* allow failure for log deletion ([eff3142](https://github.com/unraid/api/commit/eff31423927644be436a831126678719c2eb0621))
* allowed origins check not working without spaces ([#838](https://github.com/unraid/api/issues/838)) ([b998b38](https://github.com/unraid/api/commit/b998b38355fab77ecc2f62bc64896766218db3d4))
* excessive logging ([89cb254](https://github.com/unraid/api/commit/89cb2544ed0e0edd33b59f15d487487e22c0ae32))
* run hourly ([0425794](https://github.com/unraid/api/commit/0425794356a01262222e7dff2645d3629e00d0f6))

## [3.3.0](https://github.com/unraid/api/compare/v3.2.3...v3.3.0) (2024-01-09)


### Features

* add button to add current origin to extra origins setting ([8c15163](https://github.com/unraid/api/commit/8c15163b3b072122bff1f8f25de62594b1e67992))
* add environment to docker-compose ([2ee4683](https://github.com/unraid/api/commit/2ee46839095e3b8ee287cfe10f29ae9a39dcff68))
* add support for expiration in var.ini ([#833](https://github.com/unraid/api/issues/833)) ([0474c2e](https://github.com/unraid/api/commit/0474c2e14fa462d2e1ec6d9a7f974660385d073e))
* always show DRA even if disabled ([ab708c0](https://github.com/unraid/api/commit/ab708c0df634e21bf81595412d7de0be3ff7c392))
* change sort order of Update/Downgrade ([#754](https://github.com/unraid/api/issues/754)) ([be96b3a](https://github.com/unraid/api/commit/be96b3aac709682a6517fa6e84beb586b9d8bf5c))
* check for OS updates via PHP ([#752](https://github.com/unraid/api/issues/752)) ([4496615](https://github.com/unraid/api/commit/44966157b80a51dfe01d927c2af2d010c04becc5))
* close log on exit ([d6ede86](https://github.com/unraid/api/commit/d6ede86eca6301342cdf35bf1f9365896b5e5009))
* disable account & key actions when unraid-api CORS error ([1d15406](https://github.com/unraid/api/commit/1d1540646a264038ae96f4063c31a40cd048d2f9))
* extraOrigins public, remove origin listener ([91f96ba](https://github.com/unraid/api/commit/91f96ba818773d6e71dde1ff52a4c8ec21ba6b5d))
* fix codegen ([d0bf5bb](https://github.com/unraid/api/commit/d0bf5bb8197b11f7a250ca5392890184a1dbeff7))
* fix exit hook and cleanup docker scripts ([#758](https://github.com/unraid/api/issues/758)) ([a9ff73e](https://github.com/unraid/api/commit/a9ff73e0a04c67e9ec9d5551cf0b1f124be6f381))
* fix logging format on start and stop ([c6720c3](https://github.com/unraid/api/commit/c6720c331df055480d2d65b37290f4978fe429da))
* improve check for OS updates via PHP ([cde12b2](https://github.com/unraid/api/commit/cde12b247f9bba97644750cd95a2b0db320ca1d9))
* local start command ([99b6007](https://github.com/unraid/api/commit/99b6007ba30353084a8bea54cc0e782fcc1bfea4))
* log config recreation reason ([f36c72f](https://github.com/unraid/api/commit/f36c72f5ad44b7e41d1726fa181dc2b9f594c72c))
* nestjs initial query implementation ([#748](https://github.com/unraid/api/issues/748)) ([075d7f2](https://github.com/unraid/api/commit/075d7f25785bf686779b7fee1d5ea39f09ff3ea8))
* new key types in API ([e42f9dc](https://github.com/unraid/api/commit/e42f9dc95be03e8389aac443f2147c07a316d48d))
* npm scripts to prevent webgui builds with wrong urls ([279966a](https://github.com/unraid/api/commit/279966afa3c218fbe85bafe91ee40fff2eb59ef2))
* patch DefaultPageLayout for web component ([629fec6](https://github.com/unraid/api/commit/629fec64f911131e4ab3810c99028b484ce18b83))
* **plg:** WIP extra origins support ([85acaae](https://github.com/unraid/api/commit/85acaaee02dad98eeef8a8c4a09b463e84d593b4))
* regTy swapped ([564b25c](https://github.com/unraid/api/commit/564b25cf5ce0a62d40f8d63d44c81e9c8560e0be))
* run codegen and update build script ([07512ad](https://github.com/unraid/api/commit/07512adc13ee0d819db45ff6c5c5f58a0ba31141))
* server store isOsVersionStable ([b5ee4d4](https://github.com/unraid/api/commit/b5ee4d4ee632a7528e6f5df079cab0cb5ea656eb))
* stretch downgrade component buttons ([fa4f63e](https://github.com/unraid/api/commit/fa4f63e8bfca525ccfedb16f19d395bf11a68561))
* swap to fragement usage on webcomponent ([42733ab](https://github.com/unraid/api/commit/42733abf6e443516ff715569333422ce80d3b1d2))
* **web:** caseModel ([4174d0b](https://github.com/unraid/api/commit/4174d0bf2cac99af5db48e5642e0037d7425c952))
* **web:** create script to move build to webgui repo ([92df453](https://github.com/unraid/api/commit/92df453255fed45210d9a192c68bb27d3b0ee981))
* **web:** downgrade os web component ([45496ab](https://github.com/unraid/api/commit/45496ab7685d4bbfe591be46489260bac9b03474))
* **web:** finalize api cors error & settings field ([e1d9e16](https://github.com/unraid/api/commit/e1d9e16b8e80e0940a0078131ea629559e3238ec))
* **web:** guidValidation if new keyfile auto install ([0abb196](https://github.com/unraid/api/commit/0abb196d2c57ead4dca2adb2981ab79cdd1647c4))
* **web:** localStorage craftUrl for dev ([e646187](https://github.com/unraid/api/commit/e646187b04548c010cf26c7ae38a82ced6270394))
* **web:** refactor generic updateOS with date comparison ([91a753c](https://github.com/unraid/api/commit/91a753cd7018b89d53e9cd2d7c429ce53e291336))
* **web:** registration component ui / ux ([717d873](https://github.com/unraid/api/commit/717d8733bd4b8c87b6ae6f1cd66717056c5df876))
* **web:** registration replace eligibility docs btn ([b69285f](https://github.com/unraid/api/commit/b69285ff8ca5b896082b5f0e1aeba70f9a2c5129))
* **web:** registration too many devices messaging ([1c0b5a3](https://github.com/unraid/api/commit/1c0b5a317aadf6173405770878e6038d4d8b448f))
* **web:** start prep for new key type support ([5c5035a](https://github.com/unraid/api/commit/5c5035a5446516999729ddc56d1077ee512f14d3))
* **web:** update os create flash backup button ([50ba61c](https://github.com/unraid/api/commit/50ba61cf80b7df2d121962cf4ec4b10952e8eecb))
* **web:** WIP key expiration ([24618fe](https://github.com/unraid/api/commit/24618fe09db2109c2eb57ab1655ab0fb7d79fc90))
* **web:** WIP registration page UI UX ([559e5b8](https://github.com/unraid/api/commit/559e5b8698d5df80ca57f530a2bf2cb6f01e30c7))
* **web:** WIP registration page web component ([bd772a9](https://github.com/unraid/api/commit/bd772a9c97d49b57a0b5a0e6a367c9a4e3732086))
* **web:** WIP updateOs callback ([2ad55ed](https://github.com/unraid/api/commit/2ad55ed019155e46d8627ea5c1b82cd5e4351127))
* WIP first pass at UpdateOs page replacement component ([3a5d871](https://github.com/unraid/api/commit/3a5d871f1fd054720c3693705484072ff567ff28))
* WIP UpdateOs page component ([8e4c36d](https://github.com/unraid/api/commit/8e4c36d38ce4e70307f5d14c953d5103c8b7e8e4))


### Bug Fixes

* 6.10 view release notes js ([254d894](https://github.com/unraid/api/commit/254d894f39e512d1b4a0472180cb27090de256a0))
* add missing translation keys ([03b506c](https://github.com/unraid/api/commit/03b506cd4e68f23a85bbfd54205322a6a4f93e5b))
* add serverName / description to dashboard payload ([9677aff](https://github.com/unraid/api/commit/9677aff1cd0942f36a2845f3f105601c494efd9e))
* allow null for the local entry in the myservers cfg ([01157c8](https://github.com/unraid/api/commit/01157c86ea3838ca675d65528a882cf25d0019a6))
* azure and gray theme custom colors ([92e552c](https://github.com/unraid/api/commit/92e552c9c7f7804902f18eb2d71f8483671fe048))
* codegen on web run ([e2e67c2](https://github.com/unraid/api/commit/e2e67c21067a138d963f5f10760b84cf6a533542))
* combinedKnownOrigins in state.php for UPC ([b550eea](https://github.com/unraid/api/commit/b550eeae7077cbdbd6d004506bdc96d04c04bc4c))
* Connect settings myservers config parse ([1c1483a](https://github.com/unraid/api/commit/1c1483a5cc506deab9d858dabbb8388c8b1d1ec1))
* dateTime system settings ([56ccbff](https://github.com/unraid/api/commit/56ccbff61fb61ab67277100c525b80adf95e9b72))
* **deps:** update dependency graphql to v16.8.1 ([bff1b19](https://github.com/unraid/api/commit/bff1b19706bee1e3103e3a0a1d2fceb3154f9bba))
* **deps:** update graphql-tools monorepo (major) ([#693](https://github.com/unraid/api/issues/693)) ([3447eb0](https://github.com/unraid/api/commit/3447eb047a1dcd575b88a96bbcef9946aca366a1))
* **deps:** update nest monorepo ([#816](https://github.com/unraid/api/issues/816)) ([4af3699](https://github.com/unraid/api/commit/4af36991b8b376f816ed51fd503a66e99675a3e7))
* downgrade remove erroneous file_get_contents ([df9c918](https://github.com/unraid/api/commit/df9c91867cf3f7cf6b424a386d7e68bd510ec20f))
* exit with process.exit not process.exitcode ([dcb6def](https://github.com/unraid/api/commit/dcb6def1cf3365dca819feed101160c8ad0125dc))
* graphQL CORS error detection ([e5ea67f](https://github.com/unraid/api/commit/e5ea67fe5224fd5aaf06e1e63e7efc01974a10ac))
* header version thirdPartyDriversDownloading pill ([c2ff31c](https://github.com/unraid/api/commit/c2ff31c672bc30683062c6cefbd5e744a7a2a676))
* lint unused param var prefixed ([8d103a9](https://github.com/unraid/api/commit/8d103a9ca89139d7b4f513318a67bcc64c0daa0c))
* local container startup commands cleaned up ([6c0ccb2](https://github.com/unraid/api/commit/6c0ccb2b24f98282be4db2e0b2e6362f4a187def))
* logrotate not working due to invalid ownership of unraid-api folder ([ec0581a](https://github.com/unraid/api/commit/ec0581abf58a217f698d52d5337f2b312e5a645b))
* missing translation ([81a9380](https://github.com/unraid/api/commit/81a93802993e7d95fb587cbfe3b598136a89348b))
* optional check on api.version to allow fallback to save value ([0ac4455](https://github.com/unraid/api/commit/0ac4455f78407eca7aa1d6ee360830067a1c5c3e))
* patch ShowChanges.php in 6.10 ([92d09c2](https://github.com/unraid/api/commit/92d09c2846c1bf64276e140c4cf4635e8bbfa94b))
* plg installer header version replacement ([7d0de2c](https://github.com/unraid/api/commit/7d0de2c8b3dc3c2d3c204e7846cf65d6df07545f))
* plg remove reboot-details path ([d54d90e](https://github.com/unraid/api/commit/d54d90ec04c67ee532cbcb77c4c5890545899e5a))
* **plg:** Downgrade & Update page file locations ([3fbb6b7](https://github.com/unraid/api/commit/3fbb6b70c1152d0691f3d74298908338e19cda53))
* **plg:** third party reboot detection ([f0ee640](https://github.com/unraid/api/commit/f0ee640767e446a829fd2e60033560786e5f63b0))
* plugin install should suppress output from `unraid-api stop` ([#757](https://github.com/unraid/api/issues/757)) ([3da5d95](https://github.com/unraid/api/commit/3da5d9573b499c84c25e33b26a2014e79bef40f7))
* rearrange exit hook to try to fix closing ([843d3f4](https://github.com/unraid/api/commit/843d3f41162c5dbcfd7803912b1879d7a182231a))
* refreshServerState check regExp ([7fca971](https://github.com/unraid/api/commit/7fca971cab40b6e5493e7e21baf85e3d6ba66b90))
* remove var_dump Connect settings ([9425f8b](https://github.com/unraid/api/commit/9425f8b133d44ac759d09158eadd13c81e7796fb))
* renew callback messaging in modal ([e98d065](https://github.com/unraid/api/commit/e98d0654237b111cf912eb5014dbcc5da0e92ca3))
* replaceRenew response cache use & purge ([ca85199](https://github.com/unraid/api/commit/ca851991ecb09720d70135d302aa93ad10a96d3a))
* set sha in test step as well. ([8af3367](https://github.com/unraid/api/commit/8af3367226f9a3bc51db65ffe5dd53d6c5aa0017))
* state php version checking ([494f5e9](https://github.com/unraid/api/commit/494f5e9935bc207b81098e84a0fe3e259939cf39))
* stop using username to determine reg status ([c5a6cd7](https://github.com/unraid/api/commit/c5a6cd7bf930d8bc94ccae45f5363c12fd1fccfc))
* ThirdPartyDriver messaging on Update page ([f23ad76](https://github.com/unraid/api/commit/f23ad762c04c3da918429a376146fe096a5030d5))
* try to set environment in docker build ([caece63](https://github.com/unraid/api/commit/caece63e7f180f94a7ee6b962c905296c6b987bb))
* uninstall reboot-details include ([3849462](https://github.com/unraid/api/commit/3849462f572659a43157a49511075f2d8cd5dd4c))
* unraid-api server state refresh after key extension use regExp ([490595f](https://github.com/unraid/api/commit/490595f9b420054e6c2fe40d868b902b262718af))
* updateOs auth group usage ([52b1ad9](https://github.com/unraid/api/commit/52b1ad9a7d3c9cdc989dd729d7828b0678349c27))
* updateOs type check ([ba230e2](https://github.com/unraid/api/commit/ba230e2643399fbfa1612059f235ccdf61f7f486))
* web component translations class ([6c81f6f](https://github.com/unraid/api/commit/6c81f6f70dcbe4f055a0041863fe275d6e01d6b9))
* **web:** azure & gray theme header font colors ([8a5c7c9](https://github.com/unraid/api/commit/8a5c7c9304a063b26d7ff2df5c174aa9f1c0f53c))
* **web:** card wrapper error border styles ([c71f420](https://github.com/unraid/api/commit/c71f420a4c9f7325127e3f38157dbc6255b3e139))
* **web:** connect graph error handling ([c239937](https://github.com/unraid/api/commit/c239937c407cfea0defde1994809a5c0a196cca2))
* **web:** default time format include am/pm ([31694cd](https://github.com/unraid/api/commit/31694cd7141e2ec0b0c3b4e4480d34d19c80adae))
* **web:** downgrade status pill for no downgrade available ([9d9ebb1](https://github.com/unraid/api/commit/9d9ebb1c6efd486a90dcd78ba63766e24be26d55))
* **web:** downgrade-not-available when downgrade initiated ([d060359](https://github.com/unraid/api/commit/d0603592596a3173889e9d06d57cfaa602eb80bb))
* **web:** installPlugin composable for os updates ([9fb024a](https://github.com/unraid/api/commit/9fb024a68d65905e5351cfa71ca64cdffa0fa74c))
* **web:** lint fixes ([224d637](https://github.com/unraid/api/commit/224d63773d505b8d65c9455fb94260ae617d9fe5))
* **web:** localStorage craftUrl for dev ([2e108da](https://github.com/unraid/api/commit/2e108da0db7de01d03ee3b0657a614355a61b208))
* **web:** missing translation ([74a8f27](https://github.com/unraid/api/commit/74a8f27643d7ba9c9d5dcd6a43b189a936dae648))
* **web:** missing translation for update ([cb46a94](https://github.com/unraid/api/commit/cb46a94c7238bf381fbfc48109b1dd648d2e4949))
* **web:** missing translations ([8ea733b](https://github.com/unraid/api/commit/8ea733b295a5f3bd922e867f544e5538873a5088))
* **web:** missing translations ([d2eed92](https://github.com/unraid/api/commit/d2eed9291de9297aa0d556f06b9b8f5f09734250))
* **web:** no plugin, don't show restart api button ([e628a8b](https://github.com/unraid/api/commit/e628a8b64fab4d1a5ce84af62abde3cd4c53ba96))
* **web:** preview and test releases usage ([4b8cfb4](https://github.com/unraid/api/commit/4b8cfb464e8296ce20d6ff3870949d739a86ca1b))
* **web:** reboot required disable update check link ([f029652](https://github.com/unraid/api/commit/f0296528bae52227ecbe281786ddf4d3a0cc940f))
* **web:** reg component conditional keyActions ([730dff2](https://github.com/unraid/api/commit/730dff2e6344f7ee076e1c67d82ef0783a5931b2))
* **web:** Registration key actions ([f7b1016](https://github.com/unraid/api/commit/f7b1016980c3f576b007a1d01184bf35f0eef311))
* **web:** regTy on account payload ([64b0b5e](https://github.com/unraid/api/commit/64b0b5eb5767d41012f6bcb9536030ec39e45af9))
* **web:** regUpdatesExpired use .isAfter ([5d67adf](https://github.com/unraid/api/commit/5d67adf4625a108e3374eb72714cdc1747b2a9c5))
* **web:** replace check request error handling ([c1491fe](https://github.com/unraid/api/commit/c1491fecdc327d78f8de7c0f04fda481fb47cb56))
* **web:** replaceCheck type ([1bd9729](https://github.com/unraid/api/commit/1bd9729b0197b49ca460912bbc56cd3b206d00dc))
* **web:** replaceCheck type ([8cc6020](https://github.com/unraid/api/commit/8cc602019a2c8a718b59590d166644a1cb4d16cc))
* **web:** state $_SESSION usage ([412392d](https://github.com/unraid/api/commit/412392dc1c5e612199e76ee7e1cae03705957e3d))
* **web:** state php warnings ([1460cab](https://github.com/unraid/api/commit/1460cabe6b041f9f9fb89ca474a7d7e872d31c39))
* **web:** translation ([cc85a49](https://github.com/unraid/api/commit/cc85a4903178999dbb80da50aa3b02ff38012172))
* **web:** type errors ([e6c57eb](https://github.com/unraid/api/commit/e6c57eb910a1c1f948a3104c4e7fc04ac8b2d327))
* **web:** upc dropdown updates external icon ([13936bb](https://github.com/unraid/api/commit/13936bb157f9097a19c7498fce252f3f86526ccb))
* **web:** update CallbackButton import ([eabfeca](https://github.com/unraid/api/commit/eabfeca618d3bf682a331c6d9e1f17b5facdcdca))
* **web:** Update OS auto redirect loop with account ([9b56fc3](https://github.com/unraid/api/commit/9b56fc3883f51942de9b1c8d1d1f30595fee7fa5))
* **web:** updateOs lint ([bd9e9d5](https://github.com/unraid/api/commit/bd9e9d55cc7bba432f65d78feee83526dbfff059))
* **web:** use dateTime format from server ([7090f38](https://github.com/unraid/api/commit/7090f38a9ab8b2d1dfce4095f4e2669d4d78a3e1))

### [3.2.3](https://github.com/unraid/api/compare/v3.2.2...v3.2.3) (2023-09-08)


### Bug Fixes

* **plg:** preserve & restore new plg files on install / remove ([7e1f59a](https://github.com/unraid/api/commit/7e1f59afd218235934a53ac4ea6fd166689269a4))
* remove API restart command ([0eb1530](https://github.com/unraid/api/commit/0eb1530d649647f47d26de459e394fd48e79b071))
* **web:** add missing translations ([0227a1e](https://github.com/unraid/api/commit/0227a1ed1bdf953eae7784fccf04dd94995f5114))
* **web:** htmlspecialchars name & description ([a874fd8](https://github.com/unraid/api/commit/a874fd8f4b2fdf5d261f3b167452532bf09059ab))

### [3.2.2](https://github.com/unraid/api/compare/v3.2.1...v3.2.2) (2023-09-07)


### Bug Fixes

* **web:** namespace conflight with dynamix.file.manager ([d3c2b74](https://github.com/unraid/api/commit/d3c2b74b9f36ccc3cbe6b4b633fb1a03001b73c7))

### [3.2.1](https://github.com/unraid/api/compare/v3.2.0...v3.2.1) (2023-09-06)


### Bug Fixes

* remove release notes entirely for now ([8474cce](https://github.com/unraid/api/commit/8474cce32a53c3eee83b6541ed92c5d29113d4af))
* remove staging changelog temporarily ([e4c98e8](https://github.com/unraid/api/commit/e4c98e87e39a98dd542d68161e86c73216b078d3))

## [3.2.0](https://github.com/unraid/api/compare/v3.1.1...v3.2.0) (2023-09-06)


### Features

* add env for allowing console logs on build ([0e9510c](https://github.com/unraid/api/commit/0e9510cb23f335db5902044d61e8fe3ec63c52fe))
* add readme for introspecting the api ([d69d552](https://github.com/unraid/api/commit/d69d55295a52eb78b062800fda5632f396e0b406))
* api offline restart button ([9090848](https://github.com/unraid/api/commit/90908485b079b4c23f47482b3865b702ac853f2e))
* api sign in / out ([#642](https://github.com/unraid/api/issues/642)) ([709666e](https://github.com/unraid/api/commit/709666e214920d29464c7132d8431649dfbd2ad4))
* auth web component ([3803766](https://github.com/unraid/api/commit/38037663a6e891da7f17f3860671cf477e2db2fb))
* basic vue-i18n ([4e79dfd](https://github.com/unraid/api/commit/4e79dfd13e3cfd5b1ef2effc227bad7d3aa35538))
* build with deploy to local unraid server ([ec1ed32](https://github.com/unraid/api/commit/ec1ed328ddd72e4a5136e27257b6f3de22464648))
* contact support using webgui feedback modal ([120382f](https://github.com/unraid/api/commit/120382f38632034bdfe00c050cddb670201fbbf5))
* create beta component ([5cf6cf4](https://github.com/unraid/api/commit/5cf6cf47ae4d1c1b276911ecfb78ee5c0c58e17a))
* create keyline component ([f800247](https://github.com/unraid/api/commit/f800247a6d88357ba02b71b6193d61366e1a5619))
* create main css for default vars ([e969481](https://github.com/unraid/api/commit/e96948145ffe7729b8d6a654b6b4e40d7f4f6c72))
* create meta info ServerState component ([25cd0d7](https://github.com/unraid/api/commit/25cd0d7fa58ec86707999f566654265cd70a2229))
* create UptimeExpire component ([4c12591](https://github.com/unraid/api/commit/4c12591ac3eccc8cab678511370339808745429b))
* disable sign out w/o a key ([feaf10a](https://github.com/unraid/api/commit/feaf10a165e72aa0d7bf00d03b56a7aea10ee251))
* don't watch libvirt until after start ([#644](https://github.com/unraid/api/issues/644)) ([50c5132](https://github.com/unraid/api/commit/50c5132894a7d125fe630e223dff72df65ce5181))
* download api logs web component ([588a3c5](https://github.com/unraid/api/commit/588a3c5460edf63b3bda2d9f5dc36520fdc930eb))
* eslint setup ([abff0c0](https://github.com/unraid/api/commit/abff0c09bf4d72a5acdfbfdece4cb8912e037637))
* gql retrylink ([5778466](https://github.com/unraid/api/commit/57784666b4a6b5632587dd98f3aec99b7c071874))
* i18n web components ([fb34d79](https://github.com/unraid/api/commit/fb34d79a372c32af32b59d7e6bba714661962dab))
* implement .env usage ([9f6fff1](https://github.com/unraid/api/commit/9f6fff1eb17940d20f7386f9c9552f98c4b31780))
* init commit w/ callback prototype components ([f92a0ed](https://github.com/unraid/api/commit/f92a0ed83134559f925c785390b4d4052175444a))
* injecting translations from webgui's php ([5e45d86](https://github.com/unraid/api/commit/5e45d867b7c0462d340af40a0145388d731445af))
* install key and account config webgui requests ([f79c2e5](https://github.com/unraid/api/commit/f79c2e55f443d04fa1c87261d668983b7e980d1f))
* install plugin ([695c7e7](https://github.com/unraid/api/commit/695c7e72c6562126105d819dd123b148bc5dbaee))
* KeyActions component & general progress ([e3150db](https://github.com/unraid/api/commit/e3150dbb12b9f58ae89ab6faa5ab8a546b13d323))
* node update ([#698](https://github.com/unraid/api/issues/698)) ([8d201fd](https://github.com/unraid/api/commit/8d201fdf898b38fb46e7e0ef6f3c00b03bdd6b1b))
* notification support ([#640](https://github.com/unraid/api/issues/640)) ([7d4b888](https://github.com/unraid/api/commit/7d4b888a22e4e2d6db903ba1e9d61b8f72b4c25d))
* open in upc dropdown ([7155746](https://github.com/unraid/api/commit/7155746fed8d2ef24dc231c0d4680ab830d2ca0f))
* paginate notifications ([d54ec97](https://github.com/unraid/api/commit/d54ec973060b1bdaeb212a3f02c1026b1ae9bcc8))
* quicker PR builds using docker ([7a3b802](https://github.com/unraid/api/commit/7a3b802c7908287f31b7a745862c8992cc941291))
* rebuild manifest ([617b36e](https://github.com/unraid/api/commit/617b36e0fe8c863e521c185c0d9328bc6eb7d61c))
* redact username ([#699](https://github.com/unraid/api/issues/699)) ([f037568](https://github.com/unraid/api/commit/f037568ccba6ac0e3e2c733a5312450c31abda86))
* script to deploy working changes to server ([ea4bb40](https://github.com/unraid/api/commit/ea4bb4049acbb348c35f0a9d4fa68900d7cb3a14))
* server state component ([e229128](https://github.com/unraid/api/commit/e229128a5fcc5525e044d32f65bea6561a31f025))
* server state i18n ([caaaa45](https://github.com/unraid/api/commit/caaaa45de7f638bed9993ac680193a4d26760740))
* start trial from upc ([685342f](https://github.com/unraid/api/commit/685342f356f3f5f10b4ba957bfe0ab840e9be019))
* theme setting ([42563ef](https://github.com/unraid/api/commit/42563efbe4375b8ccaff8cf3805a02a26f9369a1))
* transition dropdown ([ec6647a](https://github.com/unraid/api/commit/ec6647ad64db66ba66342e3f82fe082f1b0c74bb))
* unraid-components .gitkeep ([91b1ae9](https://github.com/unraid/api/commit/91b1ae92455ff0991a8f2bea7acef4af67003546))
* **upc:** avatar & brand components ([901d112](https://github.com/unraid/api/commit/901d112660851890f04caf4a18724f7e76173d0c))
* update small package versions ([#726](https://github.com/unraid/api/issues/726)) ([6d884fe](https://github.com/unraid/api/commit/6d884feb3646577d7781232e2872017ec4549c13))
* uptime and expire time component ([3d7c353](https://github.com/unraid/api/commit/3d7c3535fa3386f5d9fa089e16c9e628d491e24b))
* url helpers ([3ed140f](https://github.com/unraid/api/commit/3ed140ffac158c15b087fc46eb430ce4e52406ad))
* user profile dropdown components ([cbddb08](https://github.com/unraid/api/commit/cbddb08fc8df5f68fff1b654117da0460b68e316))
* vue components pass t prop ([c084162](https://github.com/unraid/api/commit/c084162c3421c4eb88f55196eb266138535713cc))
* vue3 web component translations ([48faf82](https://github.com/unraid/api/commit/48faf82f8c8ec3db0c22b87fae012a6dadc88cc8))
* **web:** disable sign in / out until connected to api ([0e0fd55](https://github.com/unraid/api/commit/0e0fd55cf88e03ca617e209cd6a5ebe14c20e877))
* **web:** restart unraid-api after sign out ([64dd8b0](https://github.com/unraid/api/commit/64dd8b09063915e7000c2681823effd16c866040))
* WIP error store progress with server data ([dfbb0c1](https://github.com/unraid/api/commit/dfbb0c1f49c3e97cea769f8e1f3d6fecd134cfb7))
* WIP global error handling ([c6e956e](https://github.com/unraid/api/commit/c6e956edcc46cc06a55d228df7415fe1574a705a))
* WIP messages from php to i18n ([dcda3fc](https://github.com/unraid/api/commit/dcda3fcfeaecda59a7259708282228b9ca695262))
* WIP promo component ([3cfeb08](https://github.com/unraid/api/commit/3cfeb0804bd40797a3d43d7b7223245c0c133dd0))
* working unraid-api gql ([418fa2b](https://github.com/unraid/api/commit/418fa2b6ac059e779aad58c78741650f25131c74))


### Bug Fixes

* actions open in new link if connect iframe ([074a988](https://github.com/unraid/api/commit/074a98825276b914416cfe902e5404481aee6a35))
* actions open in new link if in connect iframe ([623479b](https://github.com/unraid/api/commit/623479be80e8f0b54d933da26d98b6ddbcf0c7de))
* auth component button ([fe8944f](https://github.com/unraid/api/commit/fe8944f94dd3ba8ae6f33d7a5c633017559852ff))
* authAction server getter ([ef0740a](https://github.com/unraid/api/commit/ef0740a36a1e35158bcaf086b71fad9784de3289))
* avoid Vue bug remove component styles ([4e3227c](https://github.com/unraid/api/commit/4e3227c094a44e48ee5ee6a7459f6be478bb1ea3))
* builds to prevent redeclartion with webgui vars ([02ff78f](https://github.com/unraid/api/commit/02ff78fa8d55cf1fe3c47ec3f5ab32515df0e8c2))
* button component ([b486f01](https://github.com/unraid/api/commit/b486f019b482f1c95d996e20aa79ee8a36b3d83f))
* connect status icon color online ([e3eda88](https://github.com/unraid/api/commit/e3eda88194c56ddbc60452acb0b291493f2966eb))
* connect status icon color online ([12e20e6](https://github.com/unraid/api/commit/12e20e653c06f4b528bf5f7bac77f150967751af))
* coverage v8 ([4aa2f68](https://github.com/unraid/api/commit/4aa2f68a7882ad3697527f199314151c324c0d2b))
* **deps:** update apollo graphql packages ([#675](https://github.com/unraid/api/issues/675)) ([aa8e960](https://github.com/unraid/api/commit/aa8e960e6464910c4da4404f9008641c0bded23a))
* **deps:** update apollo graphql packages ([#697](https://github.com/unraid/api/issues/697)) ([b08ce31](https://github.com/unraid/api/commit/b08ce31386ad36a6fb7706f2308724fdf4fb8704))
* **deps:** update dependency @headlessui/vue to v1.7.15 ([#657](https://github.com/unraid/api/issues/657)) ([0501fff](https://github.com/unraid/api/commit/0501fff516536e133e0a2465c3c0e9902019ed67))
* **deps:** update dependency @vueuse/components to v10.3.0 ([#676](https://github.com/unraid/api/issues/676)) ([301dc62](https://github.com/unraid/api/commit/301dc62b533c08c1a0b0fc56c6729644f93f11c5))
* **deps:** update dependency convert to v4.13.1 ([#677](https://github.com/unraid/api/issues/677)) ([65cdc90](https://github.com/unraid/api/commit/65cdc9016e82a24b00d83bd27bcb2a52a7162a37))
* **deps:** update dependency cross-fetch to v3.1.8 ([#658](https://github.com/unraid/api/issues/658)) ([dbed55c](https://github.com/unraid/api/commit/dbed55c2c43250463278e2007818828f859a5f65))
* **deps:** update dependency dotenv to v16.3.1 ([#678](https://github.com/unraid/api/issues/678)) ([c8d70c7](https://github.com/unraid/api/commit/c8d70c7e6424df687e73a81483a2049ffca65da1))
* **deps:** update dependency graphql to v16.7.1 ([#679](https://github.com/unraid/api/issues/679)) ([84f6e6d](https://github.com/unraid/api/commit/84f6e6dab8fbf4b867b187cfe499c790a84d26b1))
* **deps:** update dependency graphql-scalars to v1.22.2 ([#680](https://github.com/unraid/api/issues/680)) ([7d6de18](https://github.com/unraid/api/commit/7d6de1879aa99e33155218aefd35c3db1e8df419))
* **deps:** update dependency graphql-ws to v5.14.0 ([#681](https://github.com/unraid/api/issues/681)) ([807ed2b](https://github.com/unraid/api/commit/807ed2b3e611dd8f5ef49eadd1e3e800f8ce372a))
* **deps:** update dependency ini to v4.1.1 ([#659](https://github.com/unraid/api/issues/659)) ([feb8613](https://github.com/unraid/api/commit/feb86131c04a0e18ca56466fbfad6da0c06d63d0))
* **deps:** update dependency jose to v4.14.4 ([#592](https://github.com/unraid/api/issues/592)) ([ad0cfe3](https://github.com/unraid/api/commit/ad0cfe3330eb0223c9c539c241b50fd5a449f5b5))
* **deps:** update dependency launchdarkly-eventsource to v2 ([#692](https://github.com/unraid/api/issues/692)) ([90bcdff](https://github.com/unraid/api/commit/90bcdff1774696351439fdf3e2137f1cc87c614f))
* **deps:** update dependency openid-client to v5.4.3 ([#624](https://github.com/unraid/api/issues/624)) ([8fa2f5f](https://github.com/unraid/api/commit/8fa2f5f512acd5484d7f6713258ad7f4955783a7))
* **deps:** update dependency semver to v7.5.4 ([#660](https://github.com/unraid/api/issues/660)) ([de68b9a](https://github.com/unraid/api/commit/de68b9ac9d6ac12f2b9489b54110c7579b5f0c6c))
* **deps:** update dependency systeminformation to v5.18.14 ([#682](https://github.com/unraid/api/issues/682)) ([e25b90e](https://github.com/unraid/api/commit/e25b90e9944e956435ae5ec5d520cda11d867895))
* **deps:** update dependency systeminformation to v5.21.3 ([#721](https://github.com/unraid/api/issues/721)) ([8177919](https://github.com/unraid/api/commit/81779193618c4459674c215bf9f4dfd30784f6a7))
* **deps:** update dependency ts-command-line-args to v2.5.1 ([#661](https://github.com/unraid/api/issues/661)) ([bb13c49](https://github.com/unraid/api/commit/bb13c490e1827bd14d5de43fa486a692f78c2da4))
* **deps:** update graphql-tools monorepo ([#621](https://github.com/unraid/api/issues/621)) ([231d8e9](https://github.com/unraid/api/commit/231d8e99688c8441c8838e91c35443b9524e500f))
* download api logs sizing ([90c253b](https://github.com/unraid/api/commit/90c253b9e81fca1ccb98b8bdba86c41800d15b8d))
* dropdown content keyline conditional display ([b1fcaf3](https://github.com/unraid/api/commit/b1fcaf38523d87cc65dcf378c72c89db13436b05))
* eslint fixes rd.1 ([aa87993](https://github.com/unraid/api/commit/aa87993fccbaac89eb9d65773f9b3be37e778506))
* eslint fixes rd.3 ([40afab9](https://github.com/unraid/api/commit/40afab95d586579669acc6174c06f169b552c79c))
* eslint fixes stores ([9ab7824](https://github.com/unraid/api/commit/9ab78246f35a8f9040f5a816f31404fe2eccf1b8))
* eslint fixes stores rd.2 ([807e3ad](https://github.com/unraid/api/commit/807e3ad6336218dc79df121d42cc07a43e4d619e))
* expired state ([ca45562](https://github.com/unraid/api/commit/ca455629c34ed5ab5e4f66cdb13462f10a0b8cdb))
* format time ([5e29475](https://github.com/unraid/api/commit/5e294751cabf72669cb9adca268ee47ced70aa87))
* invalid api key error only w/ plg ([21ab3b7](https://github.com/unraid/api/commit/21ab3b7085ee62b5215613d6a291f4d333a88c79))
* launchpad width ([9e85d24](https://github.com/unraid/api/commit/9e85d24e66395445e8f79e02d48f0ad96d039016))
* loader in modal ([3304292](https://github.com/unraid/api/commit/33042920bab778619ef4f42e3a3516f5f5834cab))
* locale data ts ([db73d66](https://github.com/unraid/api/commit/db73d66bcdcd4c3c3e74e71a09fa780096d94f06))
* missing translation key ([6da1680](https://github.com/unraid/api/commit/6da16807628fdabf2869ab425ddb7ef3064af73c))
* missing upgrade translation for callback ([1430ec0](https://github.com/unraid/api/commit/1430ec0674285ecaab6ea5ad0073e122a8c2107a))
* myservers2 var usage for plugin version ([90ecc27](https://github.com/unraid/api/commit/90ecc27eca39639b7e4f3c479fb48ed4d0153162))
* nuxt config type ([7457302](https://github.com/unraid/api/commit/74573023dfdf23ee56b94649a5a1e4fc6beb5fde))
* **plg:** server-state parse dynamix.cfg ([695809d](https://github.com/unraid/api/commit/695809dd0aec60c56d2b9767c28b2d55f2151856))
* prevent api client from starting to early ([76ca88e](https://github.com/unraid/api/commit/76ca88e95ca6f62b4417e5ac03c0b2d10e1690e9))
* PRO state remove upgrade btn ([3d812d4](https://github.com/unraid/api/commit/3d812d4747ef4a1bd7b885a8c06520c6d73940b2))
* purchase payloads ([7376be4](https://github.com/unraid/api/commit/7376be4301f3a05da59c0479244221bbd0a795b7))
* remove login / logout listener ([#728](https://github.com/unraid/api/issues/728)) ([06e959b](https://github.com/unraid/api/commit/06e959b4c6ce2b0d4474ac2e84b4956df6f7c76d))
* remove some notices ([#649](https://github.com/unraid/api/issues/649)) ([1dd28d1](https://github.com/unraid/api/commit/1dd28d103e746548e9fd6b7a9b16d22146fd0859))
* remove translation test from connect settings ([7b1b255](https://github.com/unraid/api/commit/7b1b25532de53e648dce3cf2518c0ddcf27b3f63))
* run pr build on renovate ([9f1f443](https://github.com/unraid/api/commit/9f1f4435d618ccdacff9192f2c3ef516efde8071))
* server state buy component ([b926f5e](https://github.com/unraid/api/commit/b926f5e642fbbe177429aa96e030c18d3a417bf4))
* sign in / out only allowed with plg installed ([74e7bb2](https://github.com/unraid/api/commit/74e7bb299b0b23b57a935e753c79678cd905fb1c))
* sign in post working ([88f1854](https://github.com/unraid/api/commit/88f185416fd76adc7f27d616765bc529191d77b1))
* translation key issue ([e8ec081](https://github.com/unraid/api/commit/e8ec081f367f9a45724b1f2b3ed01f67eb516f3d))
* translation keys for errors ([033cd7f](https://github.com/unraid/api/commit/033cd7f27c37962d6dc6abc5448dea87943b6bc5))
* upc text vertical centering ([d2e68ea](https://github.com/unraid/api/commit/d2e68ea6806ff7ba3d3186502565c682161ad77f))
* **upc:** callback modal trial install expiration time ([162928a](https://github.com/unraid/api/commit/162928ab308020a040e8c8214a11ffeec8bb2665))
* **upc:** dropdown button title ([5de7ebe](https://github.com/unraid/api/commit/5de7ebed53c96ec8081257abf6d40542d68805cd))
* **upc:** open dropdown first ENOKEYFILE page load ([829a82f](https://github.com/unraid/api/commit/829a82f4f39305d1c826e5133138af485c15a9aa))
* upgrades ([1a7f7b7](https://github.com/unraid/api/commit/1a7f7b710558be75d90f90c0baf460cddd099ee4))
* UptimeExpire ([5f9064d](https://github.com/unraid/api/commit/5f9064dc481ca197e0d059771929cfa64b51dc32))
* WanIpCheck web component ([1d0a2d4](https://github.com/unraid/api/commit/1d0a2d44498033f4581d0d630fedf74ca7a69405))
* web component modals ([b95ba5b](https://github.com/unraid/api/commit/b95ba5b2fe08b11a6935538dee98c543fac30f85))
* web component styles ([30e8812](https://github.com/unraid/api/commit/30e8812837a42da1a2e66444eafb8f293e5be3a4))
* web lint ([660f9a8](https://github.com/unraid/api/commit/660f9a87b068e04d0697bdf60b991b794039293f))
* **web:** sign out ux hide api error ([70c1a8d](https://github.com/unraid/api/commit/70c1a8db67e1a4870ef092c2ed5bb79ca831504c))

### [3.1.1](https://github.com/unraid/api/compare/v3.1.0...v3.1.1) (2023-05-03)


### Bug Fixes

* always get unraid version from var ([#638](https://github.com/unraid/api/issues/638)) ([f117331](https://github.com/unraid/api/commit/f1173319747d26d6a0c297e0844f0746b8e8de3c))
* app can be linted ([#639](https://github.com/unraid/api/issues/639)) ([c159232](https://github.com/unraid/api/commit/c1592320b623f8e69128c7fcf184dc3ef336de99))
* disable dynamic manual port unless USE_SSL = strict ([#636](https://github.com/unraid/api/issues/636)) ([0baf138](https://github.com/unraid/api/commit/0baf1385ebc86f63dd645e4da584bd4c94b92a07))
* ensure api key before allowing connection ([#635](https://github.com/unraid/api/issues/635)) ([ffe9d2c](https://github.com/unraid/api/commit/ffe9d2cff65a08e964ca585319333d522a2429bd))

## [3.1.0](https://github.com/unraid/api/compare/v3.0.1...v3.1.0) (2023-04-27)


### Features

* add dynamix.cfg to store ([#429](https://github.com/unraid/api/issues/429)) ([a556bf7](https://github.com/unraid/api/commit/a556bf710dc19cd8e829c56c11ac34dfec5b27e5))
* add new translations for updating ([#626](https://github.com/unraid/api/issues/626)) ([ed4b049](https://github.com/unraid/api/commit/ed4b0496291d7c35c7dc7274758c803d2f0ce614))
* add report to zip file ([#628](https://github.com/unraid/api/issues/628)) ([f253a82](https://github.com/unraid/api/commit/f253a828a81f975da6d8a8f3b46e6ad14bb250bd))
* add web component to settings for api logs download ([#627](https://github.com/unraid/api/issues/627)) ([63ce94d](https://github.com/unraid/api/commit/63ce94df120a8d6301e4ae8862acfa4611f24bed))
* add zipped logs and more outputs ([#619](https://github.com/unraid/api/issues/619)) ([2bb39df](https://github.com/unraid/api/commit/2bb39df0ffbc827d012be7135863ec5ecfb4e43e))
* bypass cors middleware on get requests ([f295393](https://github.com/unraid/api/commit/f295393861e271c7df9881290b79d28dc2dcde2a))


### Bug Fixes

* change log request to a post ([1970635](https://github.com/unraid/api/commit/1970635f44f8f08a7b716428f509a6e88bf8d5a9))
* change to get request ([b3720f4](https://github.com/unraid/api/commit/b3720f418579e57fe725324dc4de21efc3415354))
* disable dependabot ([07604c1](https://github.com/unraid/api/commit/07604c1004924f0c6971664b953aa540b6adc88f))
* dynamic remote access docs url ([#623](https://github.com/unraid/api/issues/623)) ([a3050b5](https://github.com/unraid/api/commit/a3050b5bbc636e3b8af3da0b3db4efc8405dc33d))
* env not logged when switching ([5dfb397](https://github.com/unraid/api/commit/5dfb397788c2b64360a60abeef78f9fe6da8df59))
* switch-env actually works every time now ([#629](https://github.com/unraid/api/issues/629)) ([2023049](https://github.com/unraid/api/commit/20230496c26c1617be3066c9c7342d2c74d386f8))
* tolowercase calls and upgrade deps ([#622](https://github.com/unraid/api/issues/622)) ([1397258](https://github.com/unraid/api/commit/13972586b132cd72908543a038e35405214488c9))
* unit conversions ([#616](https://github.com/unraid/api/issues/616)) ([b26ff38](https://github.com/unraid/api/commit/b26ff388db0cf73c5e5df8b79e99afad84da24b7))

### [3.0.1](https://github.com/unraid/api/compare/v3.0.0...v3.0.1) (2023-04-25)


### Bug Fixes

* add missing signInUnraidNetAccount translation key ([#614](https://github.com/unraid/api/issues/614)) ([bee6203](https://github.com/unraid/api/commit/bee62030f24f0d60cf0d9d4b4d0e1c8c4db5f8f2))
* remote client non-http ([#617](https://github.com/unraid/api/issues/617)) ([e80cfe3](https://github.com/unraid/api/commit/e80cfe3d67a903afa3389cfb762cfce3fc368593))
* webgui listening on different port ([#615](https://github.com/unraid/api/issues/615)) ([59c3c9d](https://github.com/unraid/api/commit/59c3c9d6694a2cc83b734b4ac8d42621df90f596))

## [3.0.0](https://github.com/unraid/api/compare/v2.58.0...v3.0.0) (2023-04-25)

## [2.58.0](https://github.com/unraid/api/compare/v2.57.0...v2.58.0) (2023-04-25)


### Features

* add user agent to mothership socket ([b88dcdf](https://github.com/unraid/api/commit/b88dcdf76bd290034f3a7d5df9d2f6bcd4c7087d))
* allow hot swap between graphql-ws and graphql-subscriptions ([#563](https://github.com/unraid/api/issues/563)) ([c71c321](https://github.com/unraid/api/commit/c71c321e8211d656f093df4c627ec4b0c13ca56c))
* banner / case image api ([#535](https://github.com/unraid/api/issues/535)) ([48d745d](https://github.com/unraid/api/commit/48d745d287fb725a71152768c4771a1c070c3195))
* drop support for 6.9.x and 6.10.0-rc ([#591](https://github.com/unraid/api/issues/591)) ([1386ea5](https://github.com/unraid/api/commit/1386ea564385cfe0f5fc818b3c487a54e127f125))
* dynamic remote access ([#533](https://github.com/unraid/api/issues/533)) ([1b72002](https://github.com/unraid/api/commit/1b72002cca94c9da518a662f8cc0b6e033e94a69))
* fix docker state problem ([#561](https://github.com/unraid/api/issues/561)) ([38049b2](https://github.com/unraid/api/commit/38049b2f2e0012041a0a43538b592cfc66ac4e3a))
* group settings into sections ([#602](https://github.com/unraid/api/issues/602)) ([987603f](https://github.com/unraid/api/commit/987603f0b896de9f0a4a82a2136d2d8cc9939540))
* improve config change events, login logout events ([#562](https://github.com/unraid/api/issues/562)) ([2673e51](https://github.com/unraid/api/commit/2673e51feb0685ae8739936b5c54607018d05d1f))
* improve logging support ([#550](https://github.com/unraid/api/issues/550)) ([50343aa](https://github.com/unraid/api/commit/50343aa60b86756865439b98b7112bbea8433502))
* initial commit - add validators ([#552](https://github.com/unraid/api/issues/552)) ([271ca27](https://github.com/unraid/api/commit/271ca2792cff58e83a75710944ecf2cef7921f43))
* Make update.htm work in an iframe ([#566](https://github.com/unraid/api/issues/566)) ([4869238](https://github.com/unraid/api/commit/48692383f4cbf3ea6c1096836431c92ddd13841b))
* relax firefox restrictions ([#556](https://github.com/unraid/api/issues/556)) ([50eac9f](https://github.com/unraid/api/commit/50eac9ff46c49ef963cf61f8fbeff8027471ce48))
* reload nginx / dns when wan changes ([#587](https://github.com/unraid/api/issues/587)) ([ab2e5fe](https://github.com/unraid/api/commit/ab2e5fe71765168016761363fa1cd75eb7397e67))
* remove servers query and change websocket load ([#595](https://github.com/unraid/api/issues/595)) ([17e5e9e](https://github.com/unraid/api/commit/17e5e9e171ee3df2d093fcea0db967b567581135))
* set frame-ancestors in prod plugin too ([#558](https://github.com/unraid/api/issues/558)) ([892f99e](https://github.com/unraid/api/commit/892f99ea2ba480d57a3b82c458df789fc931b881))
* update frame-ancestors ([#567](https://github.com/unraid/api/issues/567)) ([6e10a56](https://github.com/unraid/api/commit/6e10a560eb51cce21a4c2ea3c1ea1a56b2aec983))
* upgrade almost all NPM deps ([#569](https://github.com/unraid/api/issues/569)) ([5deb58e](https://github.com/unraid/api/commit/5deb58e5448357dc277f2eb58bd03d105114e683))
* use codegen + new ini files to handle array ([#555](https://github.com/unraid/api/issues/555)) ([194d660](https://github.com/unraid/api/commit/194d66045f0cf6dd7a5c24b67e598b3cea0468f3))
* use disks polling for disks file and skip readwrites ([#599](https://github.com/unraid/api/issues/599)) ([144b537](https://github.com/unraid/api/commit/144b53766ce91073afc04940f19115414680ae30))


### Bug Fixes

* allow sending banner images with apollo server 4 ([5a8bcd5](https://github.com/unraid/api/commit/5a8bcd5014c8b62dde87500eb07029d971e2e31e))
* attempt to fix issue validating payload when offline ([c21a13e](https://github.com/unraid/api/commit/c21a13e609171ccd8594833b0a4b54c4f56ed569))
* attempt to fix UPNP by fixing null remote URL ([1ca6513](https://github.com/unraid/api/commit/1ca651334d1cb33b6a8799ebb6ab719b64572520))
* attempt to fix watcher change ([#598](https://github.com/unraid/api/issues/598)) ([ad0059a](https://github.com/unraid/api/commit/ad0059a2ee582604874d7d9ea4a070df6dc7f6f9))
* check-dns tests no longer use static ips ([45c101f](https://github.com/unraid/api/commit/45c101f52f18ab739ba7ac88d4536be949f40c1e))
* create config if not exists in chokidar watch ([2c8a6ee](https://github.com/unraid/api/commit/2c8a6ee19ee82ff4d363bcf2d73ee251b0bd6e89))
* **deps:** update dependency convert to v4.12.0 ([#594](https://github.com/unraid/api/issues/594)) ([3a63c2f](https://github.com/unraid/api/commit/3a63c2faebf5862c31cadf6556317d969f47fe86))
* **deps:** update dependency semver to v7.5.0 ([#543](https://github.com/unraid/api/issues/543)) ([3e758d2](https://github.com/unraid/api/commit/3e758d2aefcd01e2e5b60c9052ba5a19dffcf0d0))
* even better reconnection logic ([#548](https://github.com/unraid/api/issues/548)) ([5a22f5f](https://github.com/unraid/api/commit/5a22f5f9115d077300e71e8db4041a71e94946f4))
* improve installer ([#613](https://github.com/unraid/api/issues/613)) ([135fa58](https://github.com/unraid/api/commit/135fa587ee38f68e6c77ea3ebc944f3aa65e66df))
* mdstate parser ([0b1dd9a](https://github.com/unraid/api/commit/0b1dd9a0002bd7da796bdfc97282241c41df4958))
* mothership test timing out ([#565](https://github.com/unraid/api/issues/565)) ([fde9ac3](https://github.com/unraid/api/commit/fde9ac34f87ffeab9a52bfc1803e048c8d676141))
* recover from config load errors ([4967608](https://github.com/unraid/api/commit/49676084755be3f20972d9b86c4fa5d718b6063a))
* recreate config when wiped or invalid ([3ff2341](https://github.com/unraid/api/commit/3ff2341dfbb72bb5da86e2cad2a0aa35325768c8))
* remove call to UpdateDNS, API will handle ([#588](https://github.com/unraid/api/issues/588)) ([0c676a7](https://github.com/unraid/api/commit/0c676a77ba2790563aa3d1384124aa61b5cc8fce))
* remove patch package ([#583](https://github.com/unraid/api/issues/583)) ([0d5ae4f](https://github.com/unraid/api/commit/0d5ae4fd056df47424046de0f55aba47128e3193))
* resolve hang at boot ([#593](https://github.com/unraid/api/issues/593)) ([1b95e64](https://github.com/unraid/api/commit/1b95e649673ea2379e54db3116a731ef42e5b9e3))
* restart watcher when config is deleted ([feb5cff](https://github.com/unraid/api/commit/feb5cffe4652fef8b889d8eba33fa19bd9fb6c7a))
* send error when domains not available ([0cd5f88](https://github.com/unraid/api/commit/0cd5f88029b3f6d918e6ec9495ba6bcd4b84e4bf))
* set wanaccess to no by default when no config exists ([2e123f0](https://github.com/unraid/api/commit/2e123f0d3a0d88637e37087565618a33539cdd79))
* some listener issues ([#557](https://github.com/unraid/api/issues/557)) ([0f3594b](https://github.com/unraid/api/commit/0f3594bf3a1d71b17166532e101d2191a9ae70b4))
* update plugin description and build process ([#612](https://github.com/unraid/api/issues/612)) ([c59a008](https://github.com/unraid/api/commit/c59a008b85bc7f2b64cff73c25237cf82a3c11f2))
* write config file when error with api key ([#596](https://github.com/unraid/api/issues/596)) ([09b9f4f](https://github.com/unraid/api/commit/09b9f4f8d96ecf5a6a2fb193a6ad5d5d68e26214))
* ws added to global scope in order to fix apollo ([743397a](https://github.com/unraid/api/commit/743397a38d8d98497017ade00e126bb55b329dd8))

## [2.57.0](https://github.com/unraid/api/compare/v2.56.0...v2.57.0) (2023-03-09)


### Features

* better text when logging in a user ([#526](https://github.com/unraid/api/issues/526)) ([ecd888c](https://github.com/unraid/api/commit/ecd888ceb45bcf986e3f9d335522269446cdc1ec))

## [2.56.0](https://github.com/unraid/api/compare/v2.55.1...v2.56.0) (2023-03-09)


### Features

* add timeout to report for mothership ([#508](https://github.com/unraid/api/issues/508)) ([9f09500](https://github.com/unraid/api/commit/9f095003f63066e07f3ae2728316bffcbb0a43e7))
* better reconnection logic ([#522](https://github.com/unraid/api/issues/522)) ([6cc8de6](https://github.com/unraid/api/commit/6cc8de6ef0650d5647002ec9fae4b7706211272c))
* better way to stop the api before uninstalling it ([#515](https://github.com/unraid/api/issues/515)) ([c6b5e3d](https://github.com/unraid/api/commit/c6b5e3dcf047931eaaf85434080ccef663cce714))
* build staging and production plugins from one file ([#513](https://github.com/unraid/api/issues/513)) ([724e929](https://github.com/unraid/api/commit/724e929479f12089205b2876817593fe1fac442e))
* cron to download JS daily ([#529](https://github.com/unraid/api/issues/529)) ([c5db666](https://github.com/unraid/api/commit/c5db66610b712138533b3052b5881a63fe4bfcb6))
* more detailed error location for cloud error check ([e657f31](https://github.com/unraid/api/commit/e657f314e4e4f0f5c95b825af7eb81584739e4ab))
* non-lazy error handling ([#511](https://github.com/unraid/api/issues/511)) ([2d2993e](https://github.com/unraid/api/commit/2d2993e2a8958a6f9d75ea5b00a2846a4c0ac8b6))
* non-lazy error handling ([#521](https://github.com/unraid/api/issues/521)) ([99b0199](https://github.com/unraid/api/commit/99b01994d81d57979ce5c8328244d355ed819741))
* timeout in report ([#509](https://github.com/unraid/api/issues/509)) ([605111d](https://github.com/unraid/api/commit/605111da8279417e66f2e4ca16f7c65e9e12a12d))


### Bug Fixes

* gql client better timeout ([#506](https://github.com/unraid/api/issues/506)) ([3ee9846](https://github.com/unraid/api/commit/3ee984607dd61e9bb9354f78dc4e9845b76fe091))
* increase flash backup timeout ([#527](https://github.com/unraid/api/issues/527)) ([c221076](https://github.com/unraid/api/commit/c22107646ac4430b2f4588e9388fdfa297b2ab86))
* PHP warning in UpdateFlashBackup.php ([#504](https://github.com/unraid/api/issues/504)) ([2737880](https://github.com/unraid/api/commit/27378809a835fb5c7d48c3d4afcf793e1081d5cd))
* remove staging from frame ancestors ([#512](https://github.com/unraid/api/issues/512)) ([5153dbc](https://github.com/unraid/api/commit/5153dbccd4cef1ea502866ae74177b133c40c99c))

### [2.55.1](https://github.com/unraid/api/compare/v2.55.0...v2.55.1) (2023-01-23)


### Bug Fixes

* properly set minigraph state on sign out ([#502](https://github.com/unraid/api/issues/502)) ([b90c5af](https://github.com/unraid/api/commit/b90c5af4639e5d92ee4cec35ace41ed317a550cf))

## [2.55.0](https://github.com/unraid/api/compare/v2.54.0...v2.55.0) (2023-01-18)


### Features

* api key validation rewrite ([#489](https://github.com/unraid/api/issues/489)) ([166db09](https://github.com/unraid/api/commit/166db09c387a5e4db3af41071c6192026275ffb5))
* improve allowed origin check tremendously ([#471](https://github.com/unraid/api/issues/471)) ([aea5c76](https://github.com/unraid/api/commit/aea5c76b0505ab091b196952dcddc997abde0ad2))
* listener for config file changes ([#478](https://github.com/unraid/api/issues/478)) ([fe5d8c9](https://github.com/unraid/api/commit/fe5d8c9ae32d52b11bda626592101092d8e4248d))
* network url mutation ([#467](https://github.com/unraid/api/issues/467)) ([db40aef](https://github.com/unraid/api/commit/db40aefa1a3fa1feb2e2b16b958f96e96f1b237d))
* optimize config reads in myserversX.php ([#483](https://github.com/unraid/api/issues/483)) ([30e67e5](https://github.com/unraid/api/commit/30e67e52796158cb8235ab5e12257cea0b44255f))
* remove all disabled nchan code completely ([#448](https://github.com/unraid/api/issues/448)) ([aa64ba0](https://github.com/unraid/api/commit/aa64ba027681e95b8d7f8c0e657def956e0a5c76))
* swap relay for graphql ([#446](https://github.com/unraid/api/issues/446)) ([69714e2](https://github.com/unraid/api/commit/69714e2b07132b62136566feee6ce926c8381aba))
* wireguard urls in nginx / allowed origins ([#475](https://github.com/unraid/api/issues/475)) ([7c4920d](https://github.com/unraid/api/commit/7c4920ddc8188caec2124acea629a92613095b78))


### Bug Fixes

* add better stop logic and unit tests ([#494](https://github.com/unraid/api/issues/494)) ([044b030](https://github.com/unraid/api/commit/044b030e62065aed0456bc95eddedd66e0937bcc))
* add wanport from config to remote urls ([#476](https://github.com/unraid/api/issues/476)) ([16f3df9](https://github.com/unraid/api/commit/16f3df900a08eb4e9ff7753672f7689750989b89))
* allow reconnection when internet is down ([#487](https://github.com/unraid/api/issues/487)) ([626db80](https://github.com/unraid/api/commit/626db808ae5251111c4ae92f71e8f8792161bcb9))
* allowed origins only updated when configs actually load ([#486](https://github.com/unraid/api/issues/486)) ([30f62aa](https://github.com/unraid/api/commit/30f62aa6d731fcab1b161e2d827ae4686750665e))
* attempt to fix allowed origins state file ([#484](https://github.com/unraid/api/issues/484)) ([7d98075](https://github.com/unraid/api/commit/7d9807583d1726e27f3629d9e1c49c3a86b2d907))
* attempt to fix wan port allowed origin listener ([#477](https://github.com/unraid/api/issues/477)) ([1d327e0](https://github.com/unraid/api/commit/1d327e0e8208a97de0b5c649ece7712fb856f755))
* better error detection of public/private keys for flash backup ([#498](https://github.com/unraid/api/issues/498)) ([3f46192](https://github.com/unraid/api/commit/3f46192bf29921a2be0aaacaddd57481bea45e2f))
* change how we determine connection status ([#463](https://github.com/unraid/api/issues/463)) ([bb7697f](https://github.com/unraid/api/commit/bb7697f842d2f31643e9db4c8228dd35a3f3ba7e))
* check main process before writing to disk ([#495](https://github.com/unraid/api/issues/495)) ([48d4c70](https://github.com/unraid/api/commit/48d4c70c609ddbebbcba7cefc9a9541a589db465))
* don't extract myservers.cfg in myserver1.php ([#496](https://github.com/unraid/api/issues/496)) ([84b44f2](https://github.com/unraid/api/commit/84b44f24b3c6bd22315cba7dee217c897fd29baa))
* fewer dns checks during install ([#464](https://github.com/unraid/api/issues/464)) ([f002135](https://github.com/unraid/api/commit/f002135fbd9ac596e1116c44305cae69f3807b06))
* login / logout listener ([#492](https://github.com/unraid/api/issues/492)) ([3f301ac](https://github.com/unraid/api/commit/3f301ac08b5aa850c1b8443fb3e455a97ac93ff5))
* logout user when their config is cleared ([#480](https://github.com/unraid/api/issues/480)) ([c041030](https://github.com/unraid/api/commit/c0410309eb1ed99bff40124553fab8919903b400))
* no longer return empty response for server ([#479](https://github.com/unraid/api/issues/479)) ([f35357e](https://github.com/unraid/api/commit/f35357e9c350a936bd847419d9784bc839ec98a4))
* origin check now parses to a URL ([#473](https://github.com/unraid/api/issues/473)) ([b9ce7d3](https://github.com/unraid/api/commit/b9ce7d3a837776e2bb4d558737f39a4f0ce270bb))
* origin checks now throw 403s instead of timing out ([#468](https://github.com/unraid/api/issues/468)) ([abd753f](https://github.com/unraid/api/commit/abd753fa53d1c11d4d9114870b902e80354ea2b1))
* PHP8 issue with empty var ([#491](https://github.com/unraid/api/issues/491)) ([4135c2f](https://github.com/unraid/api/commit/4135c2f0701cfc645fe5224c5966a1c8c917d883))
* stop duplicate data packets being sent for repeat subscriptions ([#434](https://github.com/unraid/api/issues/434)) ([3b5dcfc](https://github.com/unraid/api/commit/3b5dcfcdcb024125edd168afc39229c278923bbd))
* suppress origin warning if no origins to display ([#490](https://github.com/unraid/api/issues/490)) ([bf2409e](https://github.com/unraid/api/commit/bf2409ebdbaf4ac63a5d7a15a3e5f18a73af9c9b))
* wan port in URL undefined ([#485](https://github.com/unraid/api/issues/485)) ([6b37a8b](https://github.com/unraid/api/commit/6b37a8bf7b4267efe7b04cd47e0312076f11b22e))

## [2.54.0](https://github.com/unraid/api/compare/v2.53.0...v2.54.0) (2022-11-29)


### Features

* flash backup enhancements ([#425](https://github.com/unraid/api/issues/425)) ([4ae5d18](https://github.com/unraid/api/commit/4ae5d18817f86b5be0abb1e5c9f73b5d0caa3f58))
* move dashboard to global store and fix bugs ([#402](https://github.com/unraid/api/issues/402)) ([b1ab666](https://github.com/unraid/api/commit/b1ab6667520e3a2dea28cb777c26fa68c2a4853a))
* remove unused packages ([#389](https://github.com/unraid/api/issues/389)) ([be8b679](https://github.com/unraid/api/commit/be8b67921c877ec19c4d6a81d02ddaeb60b48efc))


### Bug Fixes

* add keepAlive back ([#407](https://github.com/unraid/api/issues/407)) ([7095a97](https://github.com/unraid/api/commit/7095a97013a3589fb90c80dd7e505bf2fde10989))
* be more specific with the bin for unraid-api ([#423](https://github.com/unraid/api/issues/423)) ([81c7d0c](https://github.com/unraid/api/commit/81c7d0c27bb8e5cb35aa976a5b24c3e5a9f5ea71))
* clear flash backup rate limit message ([#415](https://github.com/unraid/api/issues/415)) ([9405cf2](https://github.com/unraid/api/commit/9405cf27983a3e757ace3e3d0dfb3f39f6518426))
* delete state files when upgrading plugin ([#414](https://github.com/unraid/api/issues/414)) ([cf1fe01](https://github.com/unraid/api/commit/cf1fe01c90173702d033968b4a9b69fb67895b73))
* ensure only 1 api can run at a time ([#418](https://github.com/unraid/api/issues/418)) ([949db4c](https://github.com/unraid/api/commit/949db4c6d4c3c3a96430dd2caa148ad1912e756a))
* fix install on slower systems ([#424](https://github.com/unraid/api/issues/424)) ([7d10182](https://github.com/unraid/api/commit/7d1018262f911e14bfe1b745e76d0c662cea3ffa))
* flash backup - when rate limited disable update button ([#413](https://github.com/unraid/api/issues/413)) ([e4b3383](https://github.com/unraid/api/commit/e4b33833c2f12c75908c9e94facffc77c4d55db7))
* reorder build to fix missing package ([1200aed](https://github.com/unraid/api/commit/1200aed378eb92c5ccbf14d322920f82dfa7ca15))
* rework api install/start ([#422](https://github.com/unraid/api/issues/422)) ([5150222](https://github.com/unraid/api/commit/51502227e3c685508779e6f2ab075790715c8082))
* stop all api's on uninstall/upgrade ([#419](https://github.com/unraid/api/issues/419)) ([93c39ba](https://github.com/unraid/api/commit/93c39ba2d5b03574b19b48b11cf103987024bbb5))

## [2.53.0](https://github.com/unraid/api/compare/v2.52.1...v2.53.0) (2022-11-02)


### Features

* add emhttp store module ([#359](https://github.com/unraid/api/issues/359)) ([d890acd](https://github.com/unraid/api/commit/d890acd86577008b3a2f096490307977812a2373))
* connection to mothership required to enable flash backup and re… ([#382](https://github.com/unraid/api/issues/382)) ([dcbe726](https://github.com/unraid/api/commit/dcbe726714c40280eabc590ada1b4ef125a1deeb))
* improvements to My Servers settings page ([#385](https://github.com/unraid/api/issues/385)) ([30bdf64](https://github.com/unraid/api/commit/30bdf6464f4e60aadc810b5e0c2a8bd9490c3355))
* UpdateDNS shorten delay when restarting crashed api ([#381](https://github.com/unraid/api/issues/381)) ([8cee5be](https://github.com/unraid/api/commit/8cee5beddf63f11f12adddb45c321ffa49d7cb64))


### Bug Fixes

* add dns lookup cache ([#387](https://github.com/unraid/api/issues/387)) ([79685cc](https://github.com/unraid/api/commit/79685cca9a8bcf706361812a9729511159573aff))
* better keyfile validation and tests ([#362](https://github.com/unraid/api/issues/362)) ([6db87bc](https://github.com/unraid/api/commit/6db87bc534b37f4acf08a632e62d19cd594508dc))
* downgrade cachable lookup to fix bug ([#384](https://github.com/unraid/api/issues/384)) ([0b1326d](https://github.com/unraid/api/commit/0b1326de988b5c9e577e833491acfdcd16ab1882))
* report improvements ([#397](https://github.com/unraid/api/issues/397)) ([83efee8](https://github.com/unraid/api/commit/83efee8811f1e1d6ec0c10e6a44cc29259d624a6))
* update cachable lookup, update cloud check ([#380](https://github.com/unraid/api/issues/380)) ([2d5c7e9](https://github.com/unraid/api/commit/2d5c7e98fe0bc9cfe269584d8da39eff8da8c868))
* update cachable lookup, update cloud check ([#383](https://github.com/unraid/api/issues/383)) ([1359ef7](https://github.com/unraid/api/commit/1359ef77164f4337cea8cc01eabda12b7ea3e1ed))
* update jwt configuration ([#379](https://github.com/unraid/api/issues/379)) ([db42a1c](https://github.com/unraid/api/commit/db42a1cccfa054e5f870d6d9e03976246af60829))
* update multi-ini to serialize booleans ([#364](https://github.com/unraid/api/issues/364)) ([544976a](https://github.com/unraid/api/commit/544976a5d64010c4ae06cb11ad705a25019fb559))

### [2.52.1](https://github.com/unraid/api/compare/v2.52.0...v2.52.1) (2022-09-28)


### Bug Fixes

* don't exit install if network unavailable ([#358](https://github.com/unraid/api/issues/358)) ([ef6bc81](https://github.com/unraid/api/commit/ef6bc81360d9bd1d40b2e78a51da4aa2571fe99e))

## [2.52.0](https://github.com/unraid/api/compare/v2.51.0...v2.52.0) (2022-09-27)


### Features

* stop flash backup during shutdown/reboot ([#355](https://github.com/unraid/api/issues/355)) ([06d59ef](https://github.com/unraid/api/commit/06d59ef23124eab49971893c6447db059888d784))
* wait for git to exit, then clean up *.lock files ([#356](https://github.com/unraid/api/issues/356)) ([2ddb193](https://github.com/unraid/api/commit/2ddb1932dc303eb1c4a6786073b3e5c29fd0a65e))


### Bug Fixes

* better logout behavior ([#357](https://github.com/unraid/api/issues/357)) ([db2bdd5](https://github.com/unraid/api/commit/db2bdd582a49d27d7a475e3aca904f51ab4f7734))
* fix bug with reading configs from nchan ([#350](https://github.com/unraid/api/issues/350)) ([9e21f09](https://github.com/unraid/api/commit/9e21f09e0923614b3b5722d0407203918839f432))
* update logout logic to use a thunk ([#348](https://github.com/unraid/api/issues/348)) ([cc997d8](https://github.com/unraid/api/commit/cc997d8e9f96eec5c47d60519254f60b56ff6cd7))

## [2.51.0](https://github.com/unraid/api/compare/v2.49.2...v2.51.0) (2022-09-21)


### Features

* 🎸 reflet cron added to fix connection issues, mothership refactor ([#294](https://github.com/unraid/api/issues/294)) ([c58473f](https://github.com/unraid/api/commit/c58473fb9ce9af570764071df89937938a01e513))
* merge api-manager into store ([#330](https://github.com/unraid/api/issues/330)) ([3e403c6](https://github.com/unraid/api/commit/3e403c65d4e183e374e537090cbc1e8edbf9d7b0))
* move myservers config into store ([#317](https://github.com/unraid/api/issues/317)) ([60588f8](https://github.com/unraid/api/commit/60588f8522f2579230a6734ca527e7b6038b0279))
* switch to node 18 and pkg ([#303](https://github.com/unraid/api/issues/303)) ([22590a8](https://github.com/unraid/api/commit/22590a80a016ca65b445b01c32d7b64df3382378))


### Bug Fixes

* api version written to config on startup ([#337](https://github.com/unraid/api/issues/337)) ([dba09f1](https://github.com/unraid/api/commit/dba09f14207f67f978ac2c0944f02236002e318e))
* attempt to fix workflow again ([cae6002](https://github.com/unraid/api/commit/cae600210a7cdfacaf16a216dcc20d29d16bc8b5))
* better subscription handling ([#338](https://github.com/unraid/api/issues/338)) ([93d140c](https://github.com/unraid/api/commit/93d140c5cb337d215211d5b77b97a3d882896aaf))
* caching issues causing bugs ([#342](https://github.com/unraid/api/issues/342)) ([8f5a891](https://github.com/unraid/api/commit/8f5a8916d59c460436f35cd938bd6c2643928f4f))
* config written with no changes ([#343](https://github.com/unraid/api/issues/343)) ([c059984](https://github.com/unraid/api/commit/c0599846891f457f0c14708c858e3e22bf7e5159))
* correct version output for mjs ([#334](https://github.com/unraid/api/issues/334)) ([5679459](https://github.com/unraid/api/commit/5679459395af75e6a05946810245a6e228e1434b))
* fix main workflow ([00d6167](https://github.com/unraid/api/commit/00d6167ba3727339d0f7967b040b2af16f78242f))
* libvirt not being bundled ([#310](https://github.com/unraid/api/issues/310)) ([03c5223](https://github.com/unraid/api/commit/03c522311736d68c20ffb8f019da0000b82032d9))
* logout user when they have a bad key ([#346](https://github.com/unraid/api/issues/346)) ([2cb6a95](https://github.com/unraid/api/commit/2cb6a95961737c34c5004e024a7bc43698fafcd9))
* merge empty strings instead of undefined ([#345](https://github.com/unraid/api/issues/345)) ([7ae095b](https://github.com/unraid/api/commit/7ae095bd70a099eac0a7d588fdaff9385f1a4128))
* new args to fix daemonized process ([#308](https://github.com/unraid/api/issues/308)) ([0a5b977](https://github.com/unraid/api/commit/0a5b9779267bdf7e0b7c1553ff7d84e2606886e8))
* nginx.ini not being read at startup ([#335](https://github.com/unraid/api/issues/335)) ([5d50209](https://github.com/unraid/api/commit/5d502094c8948280d84617d74edaa383955fe938))
* remove hack node files ([#339](https://github.com/unraid/api/issues/339)) ([f06413d](https://github.com/unraid/api/commit/f06413d26318128b62470a9897fcd6e9f0da50fc))
* remove legacy peer deps ([#336](https://github.com/unraid/api/issues/336)) ([93a9830](https://github.com/unraid/api/commit/93a983073f8f4c0d9848d93267d61fbeaf9c03dd))
* remove ssh key req for PR build ([#331](https://github.com/unraid/api/issues/331)) ([d2deaf3](https://github.com/unraid/api/commit/d2deaf36d12e07f38f2550716a0c9872c241ef20))
* return no servers from endpoint to reset cache ([#307](https://github.com/unraid/api/issues/307)) ([c701f14](https://github.com/unraid/api/commit/c701f1464df0786f30fd408b2f6d09b549c587e2))
* SSH URLs ([#297](https://github.com/unraid/api/issues/297)) ([a25ebe1](https://github.com/unraid/api/commit/a25ebe1732115ff9c5d7a59f0b764fca6255e4a1))
* swap to correct import for datetime scalars ([#340](https://github.com/unraid/api/issues/340)) ([13016c2](https://github.com/unraid/api/commit/13016c27305da1c62e8de72a7dbbd3f4047228d6))
* use bash-style comment ([#344](https://github.com/unraid/api/issues/344)) ([4753912](https://github.com/unraid/api/commit/4753912ff2431f08dfe1f00ea0aa19a969057df9))

## [2.50.0](https://github.com/unraid/api/compare/v2.49.2...v2.50.0) (2022-08-29)


### Features

* 🎸 reflet cron added to fix connection issues, mothership refactor ([#294](https://github.com/unraid/api/issues/294)) ([c58473f](https://github.com/unraid/api/commit/c58473fb9ce9af570764071df89937938a01e513))
* switch to node 18 and pkg ([#303](https://github.com/unraid/api/issues/303)) ([22590a8](https://github.com/unraid/api/commit/22590a80a016ca65b445b01c32d7b64df3382378))


### Bug Fixes

* new args to fix daemonized process ([#308](https://github.com/unraid/api/issues/308)) ([0a5b977](https://github.com/unraid/api/commit/0a5b9779267bdf7e0b7c1553ff7d84e2606886e8))
* SSH URLs ([#297](https://github.com/unraid/api/issues/297)) ([a25ebe1](https://github.com/unraid/api/commit/a25ebe1732115ff9c5d7a59f0b764fca6255e4a1))

### [2.49.2](https://github.com/unraid/api/compare/v2.49.1...v2.49.2) (2022-07-26)


### Bug Fixes

* return null from cloud error when empty ([da2befe](https://github.com/unraid/api/commit/da2befe1791a3b7d9a767bcea03117d65b6e8dbc))

### [2.49.1](https://github.com/unraid/api/compare/v2.49.0...v2.49.1) (2022-07-19)


### Bug Fixes

* always use the current version ([4932d5d](https://github.com/unraid/api/commit/4932d5da4bb28b45100f17eb395516df52f64986))

## [2.49.0](https://github.com/unraid/api/compare/v2.48.0...v2.49.0) (2022-07-19)


### Features

* allow state to switch between file and nchan ([c5e80fa](https://github.com/unraid/api/commit/c5e80fa6861d8d5d5bde975ff21df5a2050e37b4))
* enable checking DNS on cloud endpoint ([f234ae4](https://github.com/unraid/api/commit/f234ae4ecf1e891f37dc6dcbbb246e9c5c7bfc1b))
* fallback to file loading if nchan fails ([4bb0d7f](https://github.com/unraid/api/commit/4bb0d7fbb43e8a5e74781d3b45e3b695e1cbf229))


### Bug Fixes

* change mini-graphql connected field to status ([fa9be05](https://github.com/unraid/api/commit/fa9be05c32dbe6a721bff61611005bf5917cfe44))
* dont exit process on restart command ([e1ba664](https://github.com/unraid/api/commit/e1ba66428bcca5f10a521e82069052d640e3b758))
* dont exit when starting ([6108a27](https://github.com/unraid/api/commit/6108a274ec378d7f6bf17add9afef35ca8e9c5df))
* ensure API reconnects on 1005/1006 ([952ae1b](https://github.com/unraid/api/commit/952ae1b95a3d3679968fed48a1d2e005922d1b39))
* ensure incorrect commands still exit the cli ([48a0417](https://github.com/unraid/api/commit/48a04176d66a2100a95013d82e62d8e8280e63ac))
* ensure logger.level gets printed as a string and not [object object] ([9583cac](https://github.com/unraid/api/commit/9583cacbc5e5d4bcf93f660aac6b3ee114974fb1))
* ensure we import the version so it's always correct ([c07235a](https://github.com/unraid/api/commit/c07235a9defdcd82f413e64be5a481f275fae69d))
* ensure we resolve the promise ([b11a779](https://github.com/unraid/api/commit/b11a7795e7bc30e75b115fced1fa0bdb50f17a05))
* exit on start/restart ([2e8a412](https://github.com/unraid/api/commit/2e8a4129f5a944641eea01c7beb7bd3534a303d4))
* got import ([a26d5c9](https://github.com/unraid/api/commit/a26d5c99e190e3a5e6574aa559408e10d2c64f82))
* importing randomUUID ([58d577d](https://github.com/unraid/api/commit/58d577d377cd70a93cb372edd6c584100c31da74))
* include runtypes in bundle ([1600217](https://github.com/unraid/api/commit/1600217f37d465ebcb7a478a35dfb800386d2642))
* only import command as it's used ([ef608ea](https://github.com/unraid/api/commit/ef608ea4c71a646c3d46ea5c00c468a0fb57097a))
* set State.switchSource timeout to one hour ([ded0234](https://github.com/unraid/api/commit/ded0234fd449cdef8bc7a1815036b40937cb3c05))
* use 1 hour for switchSource ([b948450](https://github.com/unraid/api/commit/b948450126750e21466aaecf6afd2f6c752de173))

## [2.48.0](https://github.com/unraid/api/compare/v2.47.1...v2.48.0) (2022-06-22)


### Features

* add basic version of cli/commands/report --json ([3de9a41](https://github.com/unraid/api/commit/3de9a4116e1945d585420419d9577cf5fe99aae0))
* add minigraph status and JSON to cli/report ([e5f5712](https://github.com/unraid/api/commit/e5f57121c6b0c9a150057efbf18d245a4c7ffcba))


### Bug Fixes

* add wtfnode handler ([79a954e](https://github.com/unraid/api/commit/79a954e0f97b44ec7d1333cfc32199a299059b4c))
* cleanup json report for cloud ([52fcf4c](https://github.com/unraid/api/commit/52fcf4cc9776faeb037bad91e47ea1d845eeedd3))
* ensure we bundle wtfnode ([4af1762](https://github.com/unraid/api/commit/4af17626df2687d098157f496391d73441e03536))
* imports ([1af0d81](https://github.com/unraid/api/commit/1af0d8169e36e76b089c9e2ec5e378cf41f0115c))
* imports ([bea4257](https://github.com/unraid/api/commit/bea42577ebc87334a264f6f4036bc17774bb3ceb))
* inconsistencies in report ([ac82003](https://github.com/unraid/api/commit/ac8200339323cafbf40b2d5f072d076a470d9a62))
* segfaultHandler not writing to json file ([6d1e39f](https://github.com/unraid/api/commit/6d1e39f35e2f8d3964ef3cd4b693743a7de755c3))
* types of getPermisions ([bb42417](https://github.com/unraid/api/commit/bb42417395655c9063da5849af21e83c93dc8fdb))
* update tests to match cli/report ([907ce0b](https://github.com/unraid/api/commit/907ce0b945de84e668a4db664108773c6be34506))
* use sync write for crash.json ([8ce1816](https://github.com/unraid/api/commit/8ce1816d0cfca984c339a53a398818cd6c8de8d1))
* wait only 10s for connection to start ([13b287f](https://github.com/unraid/api/commit/13b287f266f1d38e89b51db5b216546a7111b087))

### [2.47.1](https://github.com/unraid/api/compare/v2.47.0...v2.47.1) (2022-05-24)


### Bug Fixes

* restarting relay crashing API ([5f04196](https://github.com/unraid/api/commit/5f041962714c0d024b0e8bc3e7b335f105f09b28))

## [2.47.0](https://github.com/unraid/api/compare/v2.46.3...v2.47.0) (2022-05-24)


### Features

* add os.hostname and increase 1m to 1h for sweep ([ee1ee90](https://github.com/unraid/api/commit/ee1ee908cc7bec15537f0892854f61d4ffdcccae))
* add timestamp to relay logs ([1712542](https://github.com/unraid/api/commit/1712542440eebd83b0c3917bb53fcba63349903f))


### Bug Fixes

* add ending ] to owner ([62ad67c](https://github.com/unraid/api/commit/62ad67c948c0b152740b9de0e653fd3d80f57e00))
* add support for stopping subscriptions ([71549f3](https://github.com/unraid/api/commit/71549f33f87abfabe3bc45073dcb403d156f0b35))
* don't show [] when no relay message is shown ([467d30b](https://github.com/unraid/api/commit/467d30b940fcfe24122c7a59e04ed9a02b30fbec))
* ensure API wont crash on wrong subId stop message ([ca86c95](https://github.com/unraid/api/commit/ca86c952a24fb4aa8c4cb705e64ed0a8ab631419))
* ensure reconnection timeout is ms not new time ([1f7c1a6](https://github.com/unraid/api/commit/1f7c1a6739930cb0c9694ca0b06fc0250a7630cd))
* NaN ([8933fae](https://github.com/unraid/api/commit/8933fae63eb5a7da1b66847879f1031ce20ea2a4))
* on stop dont lookup operationName ([cb27b4b](https://github.com/unraid/api/commit/cb27b4baa85f38f7df690e0622122ba1980d92ab))
* only show guid in report when using -vv ([326870c](https://github.com/unraid/api/commit/326870ce2e878d2daca559a8badf0d8d2c2febb4))
* switch from 1MB -> 100MB in dashboard.array update ([d37c37c](https://github.com/unraid/api/commit/d37c37ccf38084c7e084425452c08070f04cf75a))
* use /var/log/ for relay messages ([8ec9d39](https://github.com/unraid/api/commit/8ec9d39773ae6efddb8e231183ff9a43aacf6c10))
* use string for array.capacity ([3952edc](https://github.com/unraid/api/commit/3952edc9c8d588e138e33316f44c4b6b5c4282cf))

### [2.46.3](https://github.com/unraid/api/compare/v2.46.2...v2.46.3) (2022-05-10)


### Bug Fixes

* allow my_servers to read top unraid-version field ([76fdb12](https://github.com/unraid/api/commit/76fdb12d53c7c7023b7d9d2b6c57f418c406e171))

### [2.46.2](https://github.com/unraid/api/compare/v2.46.1...v2.46.2) (2022-05-10)


### Bug Fixes

* allow mothership to read two-factor endpoint ([a57a216](https://github.com/unraid/api/commit/a57a2169b3656aa3daf012461371bd2473ee9d96))

### [2.46.1](https://github.com/unraid/api/compare/v2.46.0...v2.46.1) (2022-05-10)

## [2.46.0](https://github.com/unraid/api/compare/v2.45.1...v2.46.0) (2022-05-10)


### Features

* add smart compare to dashboard ([89b42c1](https://github.com/unraid/api/commit/89b42c165adb6e6263a9d62dd28bfb7099826f1a))
* dumb compare ([e99ef45](https://github.com/unraid/api/commit/e99ef457346236054ddbb3a0db93d607d0c439fa))


### Bug Fixes

* dashboard.hostname and add logging to data packet ([bcdb6fb](https://github.com/unraid/api/commit/bcdb6fbcd4998fc2bb11d3e8ba87cd0cebd5ec87))
* don't include dashboard.uptime.seconds ([13233bb](https://github.com/unraid/api/commit/13233bbf6f34e58cfbb63ee06bec601c39290f13))
* ensure dashboard producer doesnt get stopped ([98a21d1](https://github.com/unraid/api/commit/98a21d11c0b9e9a54d7343a1998f3823cefead6f))
* ensure dashboard.versions is resolved before publishing ([10692c9](https://github.com/unraid/api/commit/10692c94f059cc389053d45c660661ff6a00428c))
* ensure producer is started even on relay sub ([8c8910d](https://github.com/unraid/api/commit/8c8910da7de4e6a6190f2d1f92245a26fb8e9a05))
* update being sent to dashboard even if it didnt change ([8342419](https://github.com/unraid/api/commit/834241925011f98a6466582e6e2e42f4593fae0a))

### [2.45.1](https://github.com/unraid/api/compare/v2.45.0...v2.45.1) (2022-05-09)


### Bug Fixes

* add missing fields to dashboard ([8124e02](https://github.com/unraid/api/commit/8124e02cf8af6562ac0e7f41eb48080f86c6c08f))

## [2.45.0](https://github.com/unraid/api/compare/v2.44.0...v2.45.0) (2022-05-09)


### Features

* add dashboard endpoint ([5b7d1ba](https://github.com/unraid/api/commit/5b7d1ba3f1aa99c0315e67179a5fa8c06d71ced8))
* add ipv6 hash cert support to allowed origins ([e9021a1](https://github.com/unraid/api/commit/e9021a1cfa3fbd0eea0359e6a724e26d0ba5102f))


### Bug Fixes

* ensure dashboard is not inside of own field ([2e49bdb](https://github.com/unraid/api/commit/2e49bdbed78cabccf566afe45e27526e7e1942c1))
* ensure getVms doesnt throw on missing hypervisor connection ([9a690f6](https://github.com/unraid/api/commit/9a690f63ba8b36b6a7d0050d9b504f8adb86d74c))
* ensure the API sends dashboard data ([bd69ae1](https://github.com/unraid/api/commit/bd69ae1b8f08d9deeb86aea08c53e90baeb51361))
* permission on dashboard endpoint ([5e6820a](https://github.com/unraid/api/commit/5e6820a05833d0c280c4c5a84d32294c443741e2))
* permission on dashboard endpoint ([509ff40](https://github.com/unraid/api/commit/509ff40175c6681780e57476fc6ce1511783c2b7))

## [2.44.0](https://github.com/unraid/api/compare/v2.43.3...v2.44.0) (2022-04-28)


### Features

* add mothership subscription endpoint ([e197276](https://github.com/unraid/api/commit/e197276477f54bf753087a5e4da8c8e9914e4bc0))
* allow auditing relay messages ([f2ab89f](https://github.com/unraid/api/commit/f2ab89faa0f1234cbc885c67f056bb7afff2b6c2))

### [2.43.3](https://github.com/unraid/api/compare/v2.43.2...v2.43.3) (2022-04-26)


### Bug Fixes

* ensure extraOrigins is trimmed ([a1f05a1](https://github.com/unraid/api/commit/a1f05a186ec975fead726b426c8bac193c9b25b5))

### [2.43.2](https://github.com/unraid/api/compare/v2.43.1...v2.43.2) (2022-04-26)

### [2.43.1](https://github.com/unraid/api/compare/v2.43.0...v2.43.1) (2022-04-26)


### Bug Fixes

* missing slash in hash origin and missing owners in veryVerbose ([cf98bbb](https://github.com/unraid/api/commit/cf98bbb2abc51b57fdc5485453a3ba027613c882))
* possibly fix urls without WANPORT ([b460c14](https://github.com/unraid/api/commit/b460c1431163b9d3bc324cb080ae987163b41eb5))

## [2.43.0](https://github.com/unraid/api/compare/v2.42.5...v2.43.0) (2022-04-26)


### Features

* add timeout and reason to cloud endpoint ([9ebd195](https://github.com/unraid/api/commit/9ebd195a6430003c24799e30c832abb670ed1f85))
* cloud->allowedOrigins ([959b678](https://github.com/unraid/api/commit/959b678e6b51a2fc55e1d40bc9a962a342448092))


### Bug Fixes

* add ip-regex module ([bbf3527](https://github.com/unraid/api/commit/bbf3527b8543db476dd67849745845bb6477e96d))
* anonymise allowedOrigins in report ([f729b8f](https://github.com/unraid/api/commit/f729b8f6828a7b0b643c85769d93e4ac5910e93f))
* anonymise origins in cli report ([40e4799](https://github.com/unraid/api/commit/40e479941c7e10bfd89bac5f7a36fd690cc932a9))
* don't show ALLOWED_ORIGINS by default ([0affa7c](https://github.com/unraid/api/commit/0affa7c05807c8c26c24190d95d81c7f0a45f256))
* dont reconnect if API disconnects itself ([d9adb43](https://github.com/unraid/api/commit/d9adb433559d25b30ecb27271692b830ff51fbdd))
* ensure auth check is against http not ws url ([c53dade](https://github.com/unraid/api/commit/c53dade4ac51f88862af28a9342d8ac8a9310fda))
* ensure myserversConfig.remote can be updated ([18bc9f1](https://github.com/unraid/api/commit/18bc9f1cd89b27afe3eb14184bc7cfe372c94281))
* ensure only one keep-alive loop is running at a time ([02295e5](https://github.com/unraid/api/commit/02295e5dcb1a1c993f8fe3616cdc8bdec35d4a4b))
* ensure there is only one myServersConfig ([aa6009e](https://github.com/unraid/api/commit/aa6009eb6e37f4aa8d7ef93ecb21f4b3f5c0bca9))
* ensure timeout doesnt go negative ([3883452](https://github.com/unraid/api/commit/3883452ffda45d57dda3a209575f556fc6405826))
* fetch timeout for relay ([2d21cb6](https://github.com/unraid/api/commit/2d21cb685e1cda5745edf55e285dba47b9b39375))
* issues with anonymisation of origins ([e8512c0](https://github.com/unraid/api/commit/e8512c006649e74beb646739db1843d9a4558c74))
* move comment down for 2FA when vars changes ([5e01a70](https://github.com/unraid/api/commit/5e01a7083fc572daeec9edcf16dd2106393825e0))
* myServersConfig.remote not being updated ([0d6ce40](https://github.com/unraid/api/commit/0d6ce40c8f0ac13bea5e49dc281222d062409279))
* on nginx state change reload myServersConfig ([d610280](https://github.com/unraid/api/commit/d6102809d8a9a8211b623487345e71193822a54d))
* relay error might be an empty string ([61b07cb](https://github.com/unraid/api/commit/61b07cbf5c7b7c5aa5dd88aa0b07e7ab78653ab9))
* use Int not Number for graphql ([7065175](https://github.com/unraid/api/commit/706517545a6ec9dfb80220cda42a85863703cba7))
* use relay endpoint to check mothership auth not graphql ([4516b85](https://github.com/unraid/api/commit/4516b8589d164bbdf18d6cbf78c680a47da7c076))
* use String not Int for timeout ([643eeff](https://github.com/unraid/api/commit/643eeff58490f9dfbf5cd29507368107c4c3292c))
* validateApiKey throwing in non throw mode ([93f3f3e](https://github.com/unraid/api/commit/93f3f3e192eb5a06ee87217019f9eccbb06dca8c))
* version missing from flags ([6528915](https://github.com/unraid/api/commit/6528915fccb0de96faf0c67c0559beedfe5fc288))

### [2.42.5](https://github.com/unraid/api/compare/v2.42.4...v2.42.5) (2022-03-25)

### [2.42.4](https://github.com/unraid/api/compare/v2.42.3...v2.42.4) (2022-03-24)


### Bug Fixes

* version string in full release and add logging to 2FA ([75b5ccf](https://github.com/unraid/api/commit/75b5ccffc493012eb09b3531b6106c66be59cba0))

### [2.42.3](https://github.com/unraid/api/compare/v2.42.2...v2.42.3) (2022-03-24)


### Bug Fixes

* cli version command ([926379a](https://github.com/unraid/api/commit/926379affd653e84f40a2a01c6f1d19b6a9b37de))
* ensure rc versions work with semver check ([2f9d026](https://github.com/unraid/api/commit/2f9d026124cd3a5a8a4819f5cde9b3853b63d56f))
* ensure two-factor is updated on varState change ([f0204ee](https://github.com/unraid/api/commit/f0204eeb39e55680c782280da5b1c3076e7aa9f2))

### [2.42.2](https://github.com/unraid/api/compare/v2.42.1...v2.42.2) (2022-03-22)


### Bug Fixes

* ensure mocked cloud endpoint has mothership as status=ok by default ([ecdba63](https://github.com/unraid/api/commit/ecdba63ce50ad2cbc7ed9f640297b43a6c832832))

### [2.42.1](https://github.com/unraid/api/compare/v2.42.0...v2.42.1) (2022-03-11)


### Bug Fixes

* version not being replaced in full release ([638bcbe](https://github.com/unraid/api/commit/638bcbeca6a96ca3336e87fe091edebf09e83f7c))

## [2.42.0](https://github.com/unraid/api/compare/v2.41.1...v2.42.0) (2022-03-11)


### Features

* don't show interactive logs in redirected shell ([eebcc37](https://github.com/unraid/api/commit/eebcc37d638308244e7850ec6446f902d9707136))


### Bug Fixes

* add commit hash to package.json before pack ([2f6259b](https://github.com/unraid/api/commit/2f6259b2d2c5a28c79355c01031f0cd12d13c8ef))
* add placeholder in package.json for coverage test ([2dfbb69](https://github.com/unraid/api/commit/2dfbb69b5f9f43ba3ce2a75b03095f9535767bf9))
* allow report to run even if API is offline ([35b25be](https://github.com/unraid/api/commit/35b25be6bb1af0a84ce900ec15efbed66beb272a))
* disable cli report ([d4c4ecc](https://github.com/unraid/api/commit/d4c4ecc26bac447e8a32269c2472de70c149161b))
* disable cli tests and add timeout to got ([982f243](https://github.com/unraid/api/commit/982f2430a6eb264e5743e3fb7a6ead149112314a))
* interactive boolean ([a7462e7](https://github.com/unraid/api/commit/a7462e715d7f2696c00a7cc05c2afc05e2bc9699))
* isIteractive in report ([d552d7e](https://github.com/unraid/api/commit/d552d7e21d0fd7e74e2f28488d35ab85bcade499))
* mark RELAY as 'API is offline' when it's offline ([27e5bb9](https://github.com/unraid/api/commit/27e5bb9c8d2cd85488127d97da0818be1d4f602d))
* only use full version in human shown places ([e7a70c9](https://github.com/unraid/api/commit/e7a70c952e21fc93e0eacde58ddf68ad97229946))
* starting server in cli ([9b918a3](https://github.com/unraid/api/commit/9b918a386358e3e7621ce584db2719a4ebe57fcb))
* use --input flag for nexe ([4b17a83](https://github.com/unraid/api/commit/4b17a8394423066e917b8d56af8112cb68288305))
* use absolute path for nexe ([3317bcd](https://github.com/unraid/api/commit/3317bcd337da5a85862432df9e8d954275e53cf2))
* write to stdout not readline to fix pipeing ([ae0590b](https://github.com/unraid/api/commit/ae0590ba439518d39b0eb283fb4507864b0f889f))

### [2.41.1](https://github.com/unraid/api/compare/v2.41.0...v2.41.1) (2022-03-09)


### Bug Fixes

* log on timeout ([ee2c651](https://github.com/unraid/api/commit/ee2c651dc24ff6dbb02754c251a6d37180aa967b))

## [2.41.0](https://github.com/unraid/api/compare/v2.40.1...v2.41.0) (2022-03-09)


### Features

* add --raw command to report ([850ab1f](https://github.com/unraid/api/commit/850ab1f4b18bbd39739bd335373151db59368dc6))
* add cloud endpoint ([cf371e6](https://github.com/unraid/api/commit/cf371e62aa45c7bdc4169a9fcf9ece752535bff7))


### Bug Fixes

* add cloud endpoint to graphql ([735628a](https://github.com/unraid/api/commit/735628a4f5d450babc424e347d007fdda6d2d6c1))
* change imports around ([799aefa](https://github.com/unraid/api/commit/799aefa62b39421876eb98964e7b6cbd805e4cd1))
* cloud permissions ([a9e9b00](https://github.com/unraid/api/commit/a9e9b00d3d7c0026413cd76f6bc9d9990f05597c))
* got import ([4b5a3c5](https://github.com/unraid/api/commit/4b5a3c53a05cff74ab71ab04fe614b531cf5e0b1))
* import dateTime from source ([9d65afd](https://github.com/unraid/api/commit/9d65afdd81521a5591007cf1934fa0ff21bca6b2))
* include apiVersion and apiKey in rate limit check ([f32ace5](https://github.com/unraid/api/commit/f32ace5be4e6f252f8bc8f4335294558a50187d1))
* mothership auth check ([dfd324f](https://github.com/unraid/api/commit/dfd324f9b9b8ec7c8f163eeb7d8e268a4725260a))
* remove ; ([221306c](https://github.com/unraid/api/commit/221306cf838e09ee62b8587a21533c97714ea928))
* supress inital message if in raw mode ([f45b3bb](https://github.com/unraid/api/commit/f45b3bbded764fce2ad8d88750dc2e1758abb6e2))

### [2.40.1](https://github.com/unraid/api/compare/v2.40.0...v2.40.1) (2022-03-02)


### Bug Fixes

* on successful disconnect run handleError ([046ed1f](https://github.com/unraid/api/commit/046ed1f3228e5bd7b16343391bbf6df00ba778d3))
* print invalid if key is ([37be8ce](https://github.com/unraid/api/commit/37be8ce27eb84347c6ba9994c1bb358935e7fca3))
* remove first char from statusCode ([b0f09ae](https://github.com/unraid/api/commit/b0f09ae3cfb2d603ec3d32889e57101801af62f0))
* statusCode split string ([9ca4fc7](https://github.com/unraid/api/commit/9ca4fc796b0713d652005177d44bc67472d20824))
* use flashGuid for owners object ([d4614a3](https://github.com/unraid/api/commit/d4614a37498544305a615de02185eb500f996eac))

## [2.40.0](https://github.com/unraid/api/compare/v2.39.0...v2.40.0) (2022-03-01)


### Features

* on 401 sign the user out ([2f86f31](https://github.com/unraid/api/commit/2f86f31b9767c9fde2b2ecd642d08056467d72e2))

## [2.39.0](https://github.com/unraid/api/compare/v2.38.6...v2.39.0) (2022-03-01)


### Features

* add serverName to report ([ebc443c](https://github.com/unraid/api/commit/ebc443cbf95a5f641c83f8e5cd0333ce12872b12))


### Bug Fixes

* clear servers cache on key invalidation ([314a251](https://github.com/unraid/api/commit/314a251434edc756d0b5b77bbe8182c6c9db37ef))
* correct key name ([a146b8d](https://github.com/unraid/api/commit/a146b8d603f27dbe67ce1ca2ca584cb583e6a6bd))
* CRLF -> LR ([479d84c](https://github.com/unraid/api/commit/479d84cef4542ce8705413b11bcbb40ebd121bae))
* CRLF -> LR ([ba8da01](https://github.com/unraid/api/commit/ba8da014d56c5ff3a118f3adb01263778e4c9ec5))
* CRLF -> LR ([d5cfa44](https://github.com/unraid/api/commit/d5cfa447617132c3f7879ce89f756976212bff86))
* don't import VarIni in cli ([174bca7](https://github.com/unraid/api/commit/174bca7cadbd54c61ffc7c9a3ceae4c342f4c845))
* ensure key is cleared when cfg changes ([4d27c78](https://github.com/unraid/api/commit/4d27c780006db66fff0a41eab6c04e23e740e76f))
* ensure loadState doesn't throw on missing files ([7ccb09c](https://github.com/unraid/api/commit/7ccb09c5efb0bdf8defe4205a0edfe8ab91445e7))
* ensure we wait till next tick before emitting expire event ([1ce6511](https://github.com/unraid/api/commit/1ce6511aa32bbadcd9780d83c3bd9e157e6a839e))
* ensure when using loadState we account for it being undefined when missing ([808ab82](https://github.com/unraid/api/commit/808ab82b57fb0ee45f42209771a52d3056b09861))
* if not config is provided still show the report ([2d0ef3b](https://github.com/unraid/api/commit/2d0ef3b0d49f0fab0dc3a0dd6d1705eb3d368c87))
* include operationName in subscription update log ([b0d1134](https://github.com/unraid/api/commit/b0d1134d58a3f507381cea4e35d97e37c0082c59))
* log if API is offline instead of empty servers in report ([f2c9b9b](https://github.com/unraid/api/commit/f2c9b9bb96f983d5f4bf2b75e235b5d04c11a661))
* log my servers status and username if exists ([29de78f](https://github.com/unraid/api/commit/29de78fd07274c90d06d1ba173ebcaa6b646af83))
* use custom origin instead of localhost for cli ([d6705dc](https://github.com/unraid/api/commit/d6705dc0071fb43058ab42c5515ba21420e47baa))

### [2.38.6](https://github.com/unraid/api/compare/v2.38.5...v2.38.6) (2022-02-28)


### Bug Fixes

* ensure the servers query works outside of debug mode ([6bd1d9c](https://github.com/unraid/api/commit/6bd1d9cada9c6712f94133566780a52be23a2d13))

### [2.38.5](https://github.com/unraid/api/compare/v2.38.4...v2.38.5) (2022-02-28)


### Bug Fixes

* show less info about servers ([34d83f5](https://github.com/unraid/api/commit/34d83f568c010c52c23ef2ebbc3781dbaff64640))

### [2.38.4](https://github.com/unraid/api/compare/v2.38.3...v2.38.4) (2022-02-28)


### Bug Fixes

* ensure report can't get stuck with stdout kept open ([ef4f4ea](https://github.com/unraid/api/commit/ef4f4ea9b9c8e0255d56279835567b04a6b280c3))
* return servers in report ([ee17d53](https://github.com/unraid/api/commit/ee17d532a4f724cdca5367b9f2c5ae4652f3e9cb))
* return servers in report ([6369e88](https://github.com/unraid/api/commit/6369e887f79fc9aa6db834e198c3cd709f5a9c84))

### [2.38.3](https://github.com/unraid/api/compare/v2.38.2...v2.38.3) (2022-02-28)


### Bug Fixes

* log owner for each server ([858485f](https://github.com/unraid/api/commit/858485ff49eeb25efb4733f15b68426fb8a5d9d3))

### [2.38.2](https://github.com/unraid/api/compare/v2.38.1...v2.38.2) (2022-02-28)


### Bug Fixes

* include content-type header for servers request in report ([247db6f](https://github.com/unraid/api/commit/247db6f4aed39c9a65b608e3163770264004392e))

### [2.38.1](https://github.com/unraid/api/compare/v2.38.0...v2.38.1) (2022-02-28)


### Bug Fixes

* ensure report has crash logs ([322af5f](https://github.com/unraid/api/commit/322af5f307244c132ea4b1cfaaf7e4d553bc38a6))
* report servers request ([1890e91](https://github.com/unraid/api/commit/1890e91efcb590c1ef9bc4d328906e57ff339df5))

## [2.38.0](https://github.com/unraid/api/compare/v2.37.1...v2.38.0) (2022-02-28)


### Features

* better unraid-api report ([410ac0d](https://github.com/unraid/api/commit/410ac0d6ef184c422d531360d24f2e8282275a90))


### Bug Fixes

* check correct line in test ([328e0f2](https://github.com/unraid/api/commit/328e0f20fb2cecbe8b27083478a0d64a72b70b82))
* don't clear logs when in trace log level ([33269b5](https://github.com/unraid/api/commit/33269b5d4a56e4ffaf4b0e88674e70fbc1e1e03b))
* dont error on got timeout ([0fcda49](https://github.com/unraid/api/commit/0fcda49a9342b0cb986d892da727dc9f4f8a3e75))
* ensure report takes no more than 1s for each request ([2d081e5](https://github.com/unraid/api/commit/2d081e538a74d29f6ddd121472b12620c51c4eed))
* ensure we add an extra new line after the report ([5063eb5](https://github.com/unraid/api/commit/5063eb55863e2c3f9f8b792ff5eab44a816d02b4))
* fetch is not defined ([0299e97](https://github.com/unraid/api/commit/0299e97f33c3daab12da2a52be085b54f201fa01))
* fetch is not defined ([3f7eff7](https://github.com/unraid/api/commit/3f7eff7026c2ca45e4e93b45dace6de7064bbfc3))
* initialGetServers query ([d00e4a7](https://github.com/unraid/api/commit/d00e4a75f0126985e0d23bc0dae523e0170ef432))
* report if no servers were found ([6af9660](https://github.com/unraid/api/commit/6af9660a84232b9429cceb06ce07e0eb5ef3e448))
* timeout for servers endpoint ([cb67445](https://github.com/unraid/api/commit/cb67445ea5eb7cda70b6d6910db6b941ef04a9fa))
* use API key for owner lookup not guid ([e6e8266](https://github.com/unraid/api/commit/e6e8266c6bbdf161efa3543b87adb32d77285696))
* use correct type for timeout option ([78c7f7b](https://github.com/unraid/api/commit/78c7f7b614d515b0cc9ddfba7b72c7486cdf05ec))

### [2.37.1](https://github.com/unraid/api/compare/v2.37.0...v2.37.1) (2022-02-23)


### Bug Fixes

* better logging on key-server validation ([c569dd6](https://github.com/unraid/api/commit/c569dd6d65efaa8d65e03b38dbaffb58527c5332))
* don't listen to docker exec events ([f1e537e](https://github.com/unraid/api/commit/f1e537ee1d666eaf544934d6ec26cb6b23df5c36))
* ensure form body is always string ([4f080ad](https://github.com/unraid/api/commit/4f080ad0615cd4fa53545723737ad9788bb86929))
* force usage of node-fetch for fetch client ([ad4faae](https://github.com/unraid/api/commit/ad4faae9776f7e53137393e29743a5cf3b6862d6))
* log key-server error better for validation endpoint ([2e32302](https://github.com/unraid/api/commit/2e323026ea8066b1bc9768046647c54558d7663b))
* send correct content-type when submitting forms to key-server ([37187ad](https://github.com/unraid/api/commit/37187ad35e7e4726690aec0abf274c45b8def682))
* use retry-after header for fetch request ([6015239](https://github.com/unraid/api/commit/6015239f72c41be661396870a591a09d50c17df1))

## [2.37.0](https://github.com/unraid/api/compare/v2.36.3...v2.37.0) (2022-02-17)


### Features

* on crash log segfault ([5481285](https://github.com/unraid/api/commit/5481285fce86378567f7439f56dbe1fc919b9dd1))


### Bug Fixes

* better logs when API key is empty ([38e7d35](https://github.com/unraid/api/commit/38e7d35acbd9b1fbecfadad5f1dd7647543c7a66))
* cache DNS entries for TTL ([927da17](https://github.com/unraid/api/commit/927da17f3f0e91a4d9d9fa32c109d843fde71b61))
* check if new section is string not loaded ([db25b82](https://github.com/unraid/api/commit/db25b821d878dc05fb931b135e58ea668edddb1c))
* don't connect to mothership until called ([14bde11](https://github.com/unraid/api/commit/14bde11af6756c6d2bb1e806998fb91b9ce5a898))
* error message being undefined ([21ede22](https://github.com/unraid/api/commit/21ede22eab33ef014468fcdc19eb63d91501f3f8))
* error message being undefined ([3efae65](https://github.com/unraid/api/commit/3efae65596eae0ff964bdc9f93bc03fbdbc76479))
* import myserverconfig inline ([33030f5](https://github.com/unraid/api/commit/33030f5f72f4f847c3c54f34e16b30ab82f3c9d3))
* include segfault-handler in package ([3048533](https://github.com/unraid/api/commit/30485337b49b9c311822a545e57666ae499b62c8))
* log extraOrigins from file on initial set ([e1728d2](https://github.com/unraid/api/commit/e1728d27c1cc4dcbd46d253eb170d65d1f854469))
* log reason on relay disconnect ([8016754](https://github.com/unraid/api/commit/801675481f2d99fa3b8f425ffa5a7c53b63c5fc8))
* only log extraOrigins changed if it did ([026e9ea](https://github.com/unraid/api/commit/026e9ea857823e0d333e5df3a5ede58764568e13))
* true/false ([c565d5a](https://github.com/unraid/api/commit/c565d5ab8f2929b03b905a29cf3b1d433608886b))
* use file not old values ([5fa436d](https://github.com/unraid/api/commit/5fa436d57df411523cb14930e0b8b1bf27d9c2f7))

### [2.36.3](https://github.com/unraid/api/compare/v2.36.2...v2.36.3) (2022-02-03)


### Bug Fixes

* include apiKey in /servers request ([c7ff69f](https://github.com/unraid/api/commit/c7ff69f80c87f29cc6338c90c29a28696d9f65f0))

### [2.36.2](https://github.com/unraid/api/compare/v2.36.1...v2.36.2) (2022-02-02)


### Bug Fixes

* include ws library as it was removed from dep ([f5b3502](https://github.com/unraid/api/commit/f5b3502340eef5409fdedff9c2351c01b58e7c04))
* on connection to mothership's graphql send auth ([88dc667](https://github.com/unraid/api/commit/88dc667edb74f0316f8907724b0a31a3a094f315))
* remove second onConnect ([080e23b](https://github.com/unraid/api/commit/080e23b427544773698bd0db6508602e8a34b7d7))
* switch back to forked version of graphql-subscriptions-client and don't use devDeps for it ([e64d7d4](https://github.com/unraid/api/commit/e64d7d4e6776ec1f7f1e8ea4ecb0e43c0471c5f6))
* track if kicked for out of date client ([2a4d733](https://github.com/unraid/api/commit/2a4d73317797892428a9188236b235ef2f45cab6))
* update graphql-subscriptions-client to include ws ([39da3a8](https://github.com/unraid/api/commit/39da3a8da4ff6f6b91e840c6e9e9dab576822bab))
* use correct nginx state path ([902d6e8](https://github.com/unraid/api/commit/902d6e81b21b5b1a75a127e8683e2cc401991eaf))
* WebSocket is not defined ([4c9d819](https://github.com/unraid/api/commit/4c9d819434efb3132d6b9d09983938c284ef831f))
* websocket url ([31b0b9b](https://github.com/unraid/api/commit/31b0b9bdb7389a856438c6b7025c09bf797468ba))

### [2.36.1](https://github.com/unraid/api/compare/v2.36.0...v2.36.1) (2022-01-31)


### Bug Fixes

* add version and apikey to connectionParams when subbing to /graphql ([7c98f57](https://github.com/unraid/api/commit/7c98f578649dbcf6372a421fd519c8340710a575))
* import of package.json ([ab8dfa8](https://github.com/unraid/api/commit/ab8dfa84fb0e88a1ad58c4dea563d0f440d44c5b))

## [2.36.0](https://github.com/unraid/api/compare/v2.35.4...v2.36.0) (2022-01-25)


### Features

* add nginx state ([3d05583](https://github.com/unraid/api/commit/3d05583d6c9a31657a2541237e2789cb4f999c98))
* add nginx state ([a09bc85](https://github.com/unraid/api/commit/a09bc8540fae64a730f0d1f7f2fad4271dd25f30))
* use nginx state for lan/wan certs ([a54a9bd](https://github.com/unraid/api/commit/a54a9bdab59a3b884baded026cbdfeca10bab2ed))


### Bug Fixes

* allow extraOrigins to be updated while API is running ([8134017](https://github.com/unraid/api/commit/81340175d1ba3bb53fcc36dce31da69c8460f911))
* CORS returning object not array ([818ab29](https://github.com/unraid/api/commit/818ab2978689d001c4ddb0417ed093050c55db97))
* ensure servers endpoint always returns atleast the local server ([53f392e](https://github.com/unraid/api/commit/53f392e9d12e9c7b7e81c94bd43e210d8afdbb0b))
* load watcher for config at all times ([10d4a6c](https://github.com/unraid/api/commit/10d4a6cfbb5803bcad74276f676cff26c4f1c534))
* old CORS ([94f8dba](https://github.com/unraid/api/commit/94f8dba93ddf10298d32165a59d49c3413a3a378))
* only allow 2fa for 6.10+ ([bd1abd5](https://github.com/unraid/api/commit/bd1abd52e88c38bad5199c26e1789802826a51b2))
* publishing "yes" instead of boolean ([df37b06](https://github.com/unraid/api/commit/df37b0604931a28e7d7ae7dfc340181e80d1962a))
* use correct path for nginx state file ([27bd4a3](https://github.com/unraid/api/commit/27bd4a3bf38fd0c7dfa3ae2fbe0becc6c7dc7e63))
* use correct path for nginx state file ([6d0e3e2](https://github.com/unraid/api/commit/6d0e3e2a17473d26342a24524f53dace116fb344))

### [2.35.4](https://github.com/unraid/api/compare/v2.35.3...v2.35.4) (2022-01-13)

### [2.35.3](https://github.com/unraid/api/compare/v2.35.2...v2.35.3) (2022-01-06)


### Bug Fixes

* array causing ws to disconnect ([7360fe2](https://github.com/unraid/api/commit/7360fe2094f0996d12c0034da388bceb7ccf006a))
* initialQuery not replying correctly ([ea242cd](https://github.com/unraid/api/commit/ea242cdae62529429aeb2f7a6ad02f2578a81164))
* wildcard cert having *. at start ([7d87db9](https://github.com/unraid/api/commit/7d87db992bbd2875b21654a9d312d209f8d10a6b))

### [2.35.2](https://github.com/unraid/api/compare/v2.35.1...v2.35.2) (2022-01-05)


### Bug Fixes

* missing user cert throwing ([2ace864](https://github.com/unraid/api/commit/2ace864f9ff0a617c2a56c10e7d2d1ba8a992596))
* watchers not starting ([dbb110f](https://github.com/unraid/api/commit/dbb110fc441c67d72f8285dd835a43564d784bc3))

### [2.35.1](https://github.com/unraid/api/compare/v2.35.0...v2.35.1) (2022-01-05)

## [2.35.0](https://github.com/unraid/api/compare/v2.34.1...v2.35.0) (2022-01-05)


### Features

* add expiration to registration endpoint ([828db87](https://github.com/unraid/api/commit/828db87b73b110859c644e963b76a94b14602d94))
* add support for user provided certs in CORS ([32c54e3](https://github.com/unraid/api/commit/32c54e3649ef46f536c5d4c3ddf971f248c05faa))
* allow checking if 2fa is enabled ([0fbd597](https://github.com/unraid/api/commit/0fbd5976091d6a6b0f8f4f6f83b2db263e2113e6))

### [2.34.1](https://github.com/unraid/api/compare/v2.34.0...v2.34.1) (2021-12-28)


### Bug Fixes

* add debouncing to array listener for mothership ([6f02700](https://github.com/unraid/api/commit/6f0270003bd452ec4410f79727fd1b32e1a8d013))
* typo ([47e687b](https://github.com/unraid/api/commit/47e687b88632e3ca290a9e1cb33b494558429682))

## [2.34.0](https://github.com/unraid/api/compare/v2.33.4...v2.34.0) (2021-12-20)


### Features

* add support for wildcard certs ([04bcd96](https://github.com/unraid/api/commit/04bcd966a2c57a5894b75aab19795fe98a1d1c6d))
* call docker event emitter with filter ([62df8c8](https://github.com/unraid/api/commit/62df8c8592af0447b52a375381a7e5b21d812962))


### Bug Fixes

* enable all log categories by default ([e5947c2](https://github.com/unraid/api/commit/e5947c25819984332f700639309c9dabb3296dbd))
* extra-origins -> extraOrigins ([96a18d3](https://github.com/unraid/api/commit/96a18d3e6f9aab3e4530bf7976cdffc6b31bbb9d))
* noop logger ([1c81da3](https://github.com/unraid/api/commit/1c81da3ed1336364c6134a15b7f3858b3816222f))
* wildcard cert not replacing local ip dot with dash ([cf59eaf](https://github.com/unraid/api/commit/cf59eafd2d03ed296e9571ede259de3c294f0bdd))

### [2.33.4](https://github.com/unraid/api/compare/v2.33.3...v2.33.4) (2021-12-13)

### [2.33.3](https://github.com/unraid/api/compare/v2.33.2...v2.33.3) (2021-12-08)


### Bug Fixes

* 2fa checking wrong sting for token ([23d43ca](https://github.com/unraid/api/commit/23d43ca70161f9062d74755860326ef255104419))
* 2fa not using username ([c6dd461](https://github.com/unraid/api/commit/c6dd461ac60fef6b57398c3ed34f7bf3ce54ab53))

### [2.33.2](https://github.com/unraid/api/compare/v2.33.1...v2.33.2) (2021-12-08)


### Bug Fixes

* ensure 2fa tokens are validatable ([7696e29](https://github.com/unraid/api/commit/7696e297eb00be0fd7e513cda71c7b66964aaf04))

### [2.33.1](https://github.com/unraid/api/compare/v2.33.0...v2.33.1) (2021-12-08)


### Bug Fixes

* ensure json bodies can be parsed ([59d3bdc](https://github.com/unraid/api/commit/59d3bdcd1b3febede92445e892d646e28a40e4fc))
* ensure token body is never undefined ([1a37509](https://github.com/unraid/api/commit/1a375091e42340c2a1d909ddf7db1aa7cab20611))

## [2.33.0](https://github.com/unraid/api/compare/v2.32.1...v2.33.0) (2021-12-08)


### Features

* add 2fa support ([38a6cb0](https://github.com/unraid/api/commit/38a6cb0ce5958ad4ee1c8a7fcc38a93a36d80cee))


### Bug Fixes

* add twoFactor to graphql ([43c680d](https://github.com/unraid/api/commit/43c680df18cfa275efe50ab90fcb8187a4050a07))
* ensure 2fa token is valid ([eb25891](https://github.com/unraid/api/commit/eb2589156633aa25eaaf5ec5eff331dc2990ea12))
* ensure token is saved on generation ([6a441bd](https://github.com/unraid/api/commit/6a441bd08df2288721bd564243c7f8bfaf66fce6))
* ensure version is update on start ([6acd2b7](https://github.com/unraid/api/commit/6acd2b7db38aff6ef4a5bb0eeeaea590448c23c1))
* token length ([c803762](https://github.com/unraid/api/commit/c803762cc39e5bbddde8b00e73454e9eb0423d18))
* token length being too short ([661907e](https://github.com/unraid/api/commit/661907e02a01a3d22feb934079a82629eec45ed6))
* twoFactor query ([1197b84](https://github.com/unraid/api/commit/1197b84aeb648d342d0ee3fe35919c49438b22f0))

### [2.32.1](https://github.com/unraid/api/compare/v2.32.0...v2.32.1) (2021-12-03)


### Bug Fixes

* clear servers/owner on signout ([a4fbd4d](https://github.com/unraid/api/commit/a4fbd4df89eaa643c6a35b64e7da93f766ca85f1))
* ensure servers gets no servers instead of null ([b83f520](https://github.com/unraid/api/commit/b83f5205e15df0568a0be4c980c4a938135ab4d5))
* mothership connecting when key is undefined ([7b76df7](https://github.com/unraid/api/commit/7b76df7d45f8e9d3742f82f52799bdea63b9a56f))
* owner cannot be null ([acf629e](https://github.com/unraid/api/commit/acf629ed2c28c3c31797cb82efea852d98afda07))

## [2.32.0](https://github.com/unraid/api/compare/v2.31.6...v2.32.0) (2021-12-02)


### Features

* send errors to log file by default ([31ce650](https://github.com/unraid/api/commit/31ce650a86736f263c8cfb829d871bac6ddba1b4))

### [2.31.6](https://github.com/unraid/api/compare/v2.31.5...v2.31.6) (2021-12-02)


### Bug Fixes

* hardcode env file path ([aef5319](https://github.com/unraid/api/commit/aef5319cd008441cddb85614feb111f729a661b5))

### [2.31.5](https://github.com/unraid/api/compare/v2.31.4...v2.31.5) (2021-12-02)


### Bug Fixes

* correct log level in help menu ([89d5328](https://github.com/unraid/api/commit/89d5328b762c4a9e4ca13c3ccdc75e707776aba3))

### [2.31.4](https://github.com/unraid/api/compare/v2.31.3...v2.31.4) (2021-12-02)


### Bug Fixes

* allow PORT from env ([57baccf](https://github.com/unraid/api/commit/57baccf0b632a2285d084cfe7282987f664fc200))
* default to raw logs ([c1dcde9](https://github.com/unraid/api/commit/c1dcde9f7d101782bfce775ffadd81e2c21e593d))
* log type ([86deee3](https://github.com/unraid/api/commit/86deee38b7566aefe6ed97cc54516525cf7dc372))

### [2.31.3](https://github.com/unraid/api/compare/v2.31.2...v2.31.3) (2021-12-02)


### Bug Fixes

* cache valid keys until relay disconnect ([602099a](https://github.com/unraid/api/commit/602099a05d9a2ba114f3d27a599b5e0bed5a0470))
* ensure we change all loggers ([94cf1b9](https://github.com/unraid/api/commit/94cf1b9651fb68bc12fd7da9dc2ef088a3445410))
* errors being undefined ([e010a1a](https://github.com/unraid/api/commit/e010a1a19128e788442addce4602f34e2c157873))
* invert cloud check ([e3affb2](https://github.com/unraid/api/commit/e3affb2710b139e690b8e56f556cd7801f063057))
* key-server validation check failing ([5ddb4da](https://github.com/unraid/api/commit/5ddb4da9276fc07a5d6d7d55a7ebf3e04c92fb54))
* log config not working ([d954e76](https://github.com/unraid/api/commit/d954e76382ffdd77040a03423a6750f46993103a))
* logger level being overriden ([597647d](https://github.com/unraid/api/commit/597647decc30f92aaf33d9b86e8f1e6bde572b2f))
* logging using OFF instead of INFO ([46420be](https://github.com/unraid/api/commit/46420bea30558b5115f1b465c48d74dd6ffc120a))
* on log config reload log in debug mode ([d3de54d](https://github.com/unraid/api/commit/d3de54d54822ec9e953ccbdf8fd264fdf3dd4e79))
* only change logging config on start ([89b5489](https://github.com/unraid/api/commit/89b548922dc3e02b1409f6de42db8d05e7eb88a5))
* only log about config on trace ([23b0267](https://github.com/unraid/api/commit/23b0267d63e26f45d20a903ec244e50a6a055dc1))

### [2.31.2](https://github.com/unraid/api/compare/v2.31.1...v2.31.2) (2021-11-29)


### Bug Fixes

* eslint ([3618b41](https://github.com/unraid/api/commit/3618b416c0345c3c61c4e1e11e095ef02d2699ce))
* using incorrect name for output ([2934625](https://github.com/unraid/api/commit/29346259e87d93b6955967d29bf3afe7a89dd085))

### [2.31.1](https://github.com/unraid/api/compare/v2.31.0...v2.31.1) (2021-11-29)


### Bug Fixes

* allow iniBooleanToJsBoolean to support true/false and not just yes/no ([5fdf9f0](https://github.com/unraid/api/commit/5fdf9f0246b5e00e339b2a93a010c42db5c3f78d))
* allow PLAYGROUND=true and INTROSPECTION=true to enable options ([e2f54a0](https://github.com/unraid/api/commit/e2f54a05adc12e6c4c5f8854602d1f66261be635))
* API key being accepted when it was invalid ([25b7cc4](https://github.com/unraid/api/commit/25b7cc435669861edb89ece77df44c50a6668513))
* mothership->graphql logs ([ce95687](https://github.com/unraid/api/commit/ce9568736a2db886fd1288099e46417fccbd1afd))
* relay log when connecting/disconnecting ([8a79ddc](https://github.com/unraid/api/commit/8a79ddc08a1dc5ecc46ded4e55e677a77a57d67d))

## [2.31.0](https://github.com/unraid/api/compare/v2.30.1...v2.31.0) (2021-11-23)


### Features

* add file logging ([919d234](https://github.com/unraid/api/commit/919d23468e33882d0c50c39ad649559c2b599b41))


### Bug Fixes

* log levels when using file logging ([cc906d0](https://github.com/unraid/api/commit/cc906d0b5be5dd4d2bc9e9a156b9213c0d5eed33))
* subscribe to servers on boot ([3686a09](https://github.com/unraid/api/commit/3686a09550d68cbd4e9d7a181181c61e6f088916))

### [2.30.1](https://github.com/unraid/api/compare/v2.30.0...v2.30.1) (2021-11-22)


### Bug Fixes

* don't log when nothing changed ([dda22dc](https://github.com/unraid/api/commit/dda22dcd203c7e1a3dd4dd415ead4080de38823b))
* LOG_TYPE being overriden on start ([b9fc6fc](https://github.com/unraid/api/commit/b9fc6fc61fd470ca91bdc08fe986dd31b02d6d39))

## [2.30.0](https://github.com/unraid/api/compare/v2.29.7...v2.30.0) (2021-11-22)


### Features

* move extra-origins to cfg ([686fc67](https://github.com/unraid/api/commit/686fc67161a3fc31f99dee4b25d98ba453b5e075))


### Bug Fixes

* add checker for graphql ([db64460](https://github.com/unraid/api/commit/db64460f6612be2684a0da7c9b99038f0799e3d9))
* better logs for relay disconnecting/reconnecting ([30bcb34](https://github.com/unraid/api/commit/30bcb34f22fc0ecb02e1959e7498eb3c0e627609))
* clean up docker logging ([dfaf39a](https://github.com/unraid/api/commit/dfaf39ae12eaab0facf3b460c516f112e407f896))
* debounce registration event ([016cd63](https://github.com/unraid/api/commit/016cd634f0a5504976c8d9db9c4bc25069c6c896))
* ensure autoStartDomainNames is always an array ([b5b205a](https://github.com/unraid/api/commit/b5b205a57dea5ce1c438be8105673047838ef476))
* ensure graphql is restarted correctly ([d03af6e](https://github.com/unraid/api/commit/d03af6e262853bbb26b8c997e7d5777c6946c15c))

### [2.29.7](https://github.com/unraid/api/compare/v2.29.6...v2.29.7) (2021-11-19)


### Bug Fixes

* remove bad context ([077f32a](https://github.com/unraid/api/commit/077f32a47673fac2471ff1aaa9838975ea8a32eb))

### [2.29.6](https://github.com/unraid/api/compare/v2.29.5...v2.29.6) (2021-11-18)


### Bug Fixes

* move update subscription to context ([9b257e8](https://github.com/unraid/api/commit/9b257e84b68a89a3d982ba730ab7022891dfeb52))

### [2.29.5](https://github.com/unraid/api/compare/v2.29.4...v2.29.5) (2021-11-18)


### Bug Fixes

* debounce key file changes ([68cbced](https://github.com/unraid/api/commit/68cbced369b10cfecc5d85d290171678b5e4e216))
* debounce publishing to registration on var change ([7a6843a](https://github.com/unraid/api/commit/7a6843ae878b3d78cec62624bfa017d27f008f1f))
* ensure we cache registration data for check ([a0ae391](https://github.com/unraid/api/commit/a0ae391ee0407b6ae749370f5266cffb19b2e7ce))

### [2.29.4](https://github.com/unraid/api/compare/v2.29.3...v2.29.4) (2021-11-18)


### Bug Fixes

* ensure env is loaded ([df4e9a5](https://github.com/unraid/api/commit/df4e9a517a056f7c2676185922fa45d44d6e93e0))

### [2.29.3](https://github.com/unraid/api/compare/v2.29.2...v2.29.3) (2021-11-18)


### Bug Fixes

* ensure all loggers have context and are changed on USR sig ([7b86f5d](https://github.com/unraid/api/commit/7b86f5d3958ed10bc0177137ff240d151133a1ab))
* move context to only cli ([c88536d](https://github.com/unraid/api/commit/c88536d2e3a097a7c985bbf069ee21daab424722))
* move logger context additions before exports ([2b6f0ee](https://github.com/unraid/api/commit/2b6f0ee86fc75b088a1af7bc044f7d355b6e3494))
* remove api key when invalid ([2767229](https://github.com/unraid/api/commit/27672299496f89bc56fd2e2858ea81ce23ee2365))
* split logger into cli ([0781a3d](https://github.com/unraid/api/commit/0781a3d9d46a43a8ecd30158865ea63b6ff73d8e))

### [2.29.2](https://github.com/unraid/api/compare/v2.29.1...v2.29.2) (2021-11-18)


### Bug Fixes

* log-level flag ([ce360c4](https://github.com/unraid/api/commit/ce360c43a5b4ff7d700b61d13f92ea1883f47cef))
* move pid out of context ([464670b](https://github.com/unraid/api/commit/464670b68b182635351a353c97174ae5e858684f))

### [2.29.1](https://github.com/unraid/api/compare/v2.29.0...v2.29.1) (2021-11-18)


### Bug Fixes

* add trial to registrationType ([85b3575](https://github.com/unraid/api/commit/85b3575d6c8c96873324f32ad1f7aa69e92e4d89))
* allow array updates without limits ([dae5245](https://github.com/unraid/api/commit/dae524505fd2fd563d90f996d036973026fb9d44))
* recheck relay connection once every 5s ([e939188](https://github.com/unraid/api/commit/e939188a3bac56139b476861344117f829de45cc))

## [2.29.0](https://github.com/unraid/api/compare/v2.28.0...v2.29.0) (2021-11-16)


### Features

* add config ([6a35dd3](https://github.com/unraid/api/commit/6a35dd3a050c9ce1375c9b9f690a6457ce99d4e3))


### Bug Fixes

* add permissions for config ([91b294f](https://github.com/unraid/api/commit/91b294f68b19d6e88c0f0b6ca6aa1e4ec86b279c))

## [2.28.0](https://github.com/unraid/api/compare/v2.26.14...v2.28.0) (2021-11-16)


### Features

* add keepalive to relay ([4ca15d2](https://github.com/unraid/api/commit/4ca15d24683ef7a69e47ebb8fcaf2c66f61370d4))
* add new relay client ([ad29613](https://github.com/unraid/api/commit/ad296134960de6990486a31d8276920e1e5be3f7))
* add timestamp to log ([b24e05f](https://github.com/unraid/api/commit/b24e05f127425fb0c6733ca2d6ee91bbc6c0890d))


### Bug Fixes

* better logs for relay connection ([dc72ff9](https://github.com/unraid/api/commit/dc72ff9523c1a11935c08eac44bb892e7c7d2f9b))
* cli logging ([c7d6486](https://github.com/unraid/api/commit/c7d6486abda77090193a39898c373e824b3c685e))
* downgrade graphql ([2b7fd40](https://github.com/unraid/api/commit/2b7fd409d487b16a3f15630e36e2aa567f99ab38))
* ensure Func directive is included in relay's graphql query ([7416d75](https://github.com/unraid/api/commit/7416d75cbcd9712ada153ecb036d6516379a6a8c))
* ensure relay imports baseTypes ([10b1dbd](https://github.com/unraid/api/commit/10b1dbdae7aafd0002886cf577df1a828f1045d1))
* ensure we load the my servers user into context when querying graphql ([4976f40](https://github.com/unraid/api/commit/4976f409018ba62fa994cff4028ed02dd50c7921))
* import dir not file ([9338307](https://github.com/unraid/api/commit/933830771b1b0d9c5c89bd40e842572c7213f2e7))
* remove unused transport field ([aa76b55](https://github.com/unraid/api/commit/aa76b55ee23d192706a1cae0c16eb6b4e24b3a65))
* subscriptions and debounce slots ([950bb7d](https://github.com/unraid/api/commit/950bb7db795031575385a78c07699de2c7927d88))
* types is not defined ([f3716b1](https://github.com/unraid/api/commit/f3716b1adc3862801bf33d647d1033407436c04b))
* types of logger ([7908df8](https://github.com/unraid/api/commit/7908df868de9efcf343d4df7f497b2430351c2fa))
* use forked websocket-as-promised to handle unexpected-response ([f5e20f7](https://github.com/unraid/api/commit/f5e20f7b7b8808fc459dfe47ea58e225cf6ee6fa))
* use graphql-tools for now ([ec0dae2](https://github.com/unraid/api/commit/ec0dae23e600f70a34e59789ab24788f84ca2f18))
* use print for cli ([b29438d](https://github.com/unraid/api/commit/b29438d32f8d2866a3647f7fb71d26760767a31a))
* use scoped imports for graphql-tools ([9057b5a](https://github.com/unraid/api/commit/9057b5a2c0a95fc472fa639255cb2563b2aed7f4))

### [2.26.14](https://github.com/unraid/api/compare/v2.26.13...v2.26.14) (2021-09-22)


### Bug Fixes

* allow trial as regTy value ([f0dd46b](https://github.com/unraid/api/commit/f0dd46be9ba7deb15c7a51c48e034745eee88b74))

### [2.26.13](https://github.com/unraid/api/compare/v2.26.12...v2.26.13) (2021-09-22)


### Bug Fixes

* crashReporting crashing when false ([f260b7b](https://github.com/unraid/api/commit/f260b7b3d6ffea2897e16835bda9d347e697d5a9))
* pre-fill user server cache on start ([930cb17](https://github.com/unraid/api/commit/930cb17848e47419861c373a8613d46a0da67219))

### [2.26.12](https://github.com/unraid/api/compare/v2.26.11...v2.26.12) (2021-09-15)


### Bug Fixes

* add allowRetry for relay socket ([3a38e3b](https://github.com/unraid/api/commit/3a38e3badec8a2addd5d7562f5a29f71741fa950))
* ensure myServerConfig is never undefined ([d6d1f3c](https://github.com/unraid/api/commit/d6d1f3cf4a488f5e0b55e8acfc0294de9968cb73))
* log on NCHAN disconnect ([c2b2057](https://github.com/unraid/api/commit/c2b2057a15ba7414cf2a0d50479e4e5928bcb8ef))
* make imported file partial ([537a8fd](https://github.com/unraid/api/commit/537a8fdd359fa8ae4d4269fa1a8c0e62ebc00499))
* make sure lastKnownKey is updated correctly ([ea5bf9a](https://github.com/unraid/api/commit/ea5bf9aeba23aa6ddb8d8d83eda423adb4c1c6a4))
* remove allowRetry ([b1ee34a](https://github.com/unraid/api/commit/b1ee34af502c9a4c71d978245b2a444557e297c7))
* use readyState instead of bool ([b42be96](https://github.com/unraid/api/commit/b42be96b30d59aca9d733ee1cb813ac0de028230))

### [2.26.11](https://github.com/unraid/api/compare/v2.26.10...v2.26.11) (2021-09-15)


### Bug Fixes

* do a full reconnect to internal and relay ([250d651](https://github.com/unraid/api/commit/250d65187a10c86a0f3402b2c7965d65d1a99666))
* ensure we're only reconnecting one connection ([346722b](https://github.com/unraid/api/commit/346722b2d05461eaf8e1631530af2cfb4e7fdee4))

### [2.26.10](https://github.com/unraid/api/compare/v2.26.9...v2.26.10) (2021-09-15)


### Bug Fixes

* not logging exception ([3d16b27](https://github.com/unraid/api/commit/3d16b277389802f1ea82d074c744137f8fb9f335))

### [2.26.9](https://github.com/unraid/api/compare/v2.26.8...v2.26.9) (2021-09-15)


### Bug Fixes

* always reconnect to relay ([809ec5e](https://github.com/unraid/api/commit/809ec5e460c498401c94ed30081ffb41e3e7311f))
* bail on undefined in checkKey function ([2e15e98](https://github.com/unraid/api/commit/2e15e98eb1879a794e75fb27f6ddf70c6349216c))
* ensure we don't throw an error in an event callback ([e40c892](https://github.com/unraid/api/commit/e40c892cfdeaa87a652c22a95659195353e0e304))
* log key on check ([a2f0e4c](https://github.com/unraid/api/commit/a2f0e4c61f68757292909089c68ea457a38d63ec))
* log on CTRL+C exit ([e5de6de](https://github.com/unraid/api/commit/e5de6de30d489f1a88b03146b7bfa4c4e4ce7f76))

### [2.26.8](https://github.com/unraid/api/compare/v2.26.7...v2.26.8) (2021-09-14)


### Bug Fixes

* add better nchan logging ([ddff2b4](https://github.com/unraid/api/commit/ddff2b4f3ddb2659ec35881be31a8db90ebc7774))
* ensure relay connects even if the socket exists ([23a1e89](https://github.com/unraid/api/commit/23a1e894a62ad457703825666f8dc5c24cc406ab))

### [2.26.7](https://github.com/unraid/api/compare/v2.26.6...v2.26.7) (2021-09-14)


### Bug Fixes

* connecting to relay for the first time ([d131479](https://github.com/unraid/api/commit/d131479e98d45bfc40859152527a489460190608))
* improve CORS logs ([5074e2d](https://github.com/unraid/api/commit/5074e2d0f796127d40c8cf6bcd72c4f609237240))
* supress 'Key found for %s' messages ([9680679](https://github.com/unraid/api/commit/9680679dfdeb3b74d521dee62784de4fffab8b40))

### [2.26.6](https://github.com/unraid/api/compare/v2.26.5...v2.26.6) (2021-09-14)


### Bug Fixes

* better logging on RELAY:RECONNECTION ([03b172d](https://github.com/unraid/api/commit/03b172defc53a2127697340669e075e6cc171747))
* connect to relay on new API key from undefined ([8c16254](https://github.com/unraid/api/commit/8c162548a87bf8f07b8235a80114e141c270076e))
* not logging anything on unraid-api start ([5ccb049](https://github.com/unraid/api/commit/5ccb049787fb4486a9251dbaa9ae49ebf1eed683))
* reorder reconnection logic ([fc2b27c](https://github.com/unraid/api/commit/fc2b27c8daa5726a81c3af44a43dd8053d157932))
* use internal method for reconnection ([6698500](https://github.com/unraid/api/commit/669850067eed1ccc95ac570c4f9b80313ccd1898))

### [2.26.5](https://github.com/unraid/api/compare/v2.26.4...v2.26.5) (2021-09-13)


### Bug Fixes

* ensure parent process doesn't inherit child's stdio ([69e7645](https://github.com/unraid/api/commit/69e7645825bfe49b5c63582bc1c4d24bf6843a88))

### [2.26.4](https://github.com/unraid/api/compare/v2.26.3...v2.26.4) (2021-09-13)


### Bug Fixes

* add space between logger and flag ([4445772](https://github.com/unraid/api/commit/44457727e9cfb2148dbdf95545dc340f6facf6a5))
* hook process.exit in child BEFORE loading index ([33a8189](https://github.com/unraid/api/commit/33a8189a150a1d8c2d9bd4ee91cc5cd8e17ee91a))
* include zx in bundle ([c030c91](https://github.com/unraid/api/commit/c030c918dde979b705c6495daf3c9528bf81daca))
* logging on good exit ([52c51ec](https://github.com/unraid/api/commit/52c51ecd2a80669497f6c05ad137a23beefc6550))
* missing fn name ([0ada10a](https://github.com/unraid/api/commit/0ada10ab3ddcd3c38339bf5d4c14329f67437a12))
* move logging to child.on? ([fe4d879](https://github.com/unraid/api/commit/fe4d8798279efee98034514fa336e8cefe28241d))
* move process.exit to child ([c66f93b](https://github.com/unraid/api/commit/c66f93bda2016faf5ae35ad3b05d508c4157afe3))
* move zx to devDeps to bundle ([00e5739](https://github.com/unraid/api/commit/00e57393fce57e8a1c72a9d3fd22f305d6c93832))
* switch to lib for exit ([7ac1684](https://github.com/unraid/api/commit/7ac1684f19d40d3c612f1dfba5d8f0e778f23e9b))
* use exitCode to allow streams to drain on exit ([6531d6d](https://github.com/unraid/api/commit/6531d6d59e916cf422dc1f22aa6eaae6638eace8))
* use logger for syslog messages ([b832214](https://github.com/unraid/api/commit/b83221422248eac9fbdeb1263995d0f4dc75c1fc))
* use logger tags ([35b5356](https://github.com/unraid/api/commit/35b5356e3b2af3f420dcaf6094cc2fe0a37a61de))

### [2.26.3](https://github.com/unraid/api/compare/v2.26.2...v2.26.3) (2021-09-09)


### Bug Fixes

* allow --debug to enable debug logs without NODE_ENV ([243de07](https://github.com/unraid/api/commit/243de07a4169df709b0786834c614e98d831a585))
* move exit message to child_process on successful http listen ([e9779e7](https://github.com/unraid/api/commit/e9779e74f13cd1f0e59b9cdc94c0298d0795db06))
* remove PRO from ConfigErrorState ([0e7b996](https://github.com/unraid/api/commit/0e7b9968b5d1e4aebfe2f0e9898d423038410aed))

### [2.26.2](https://github.com/unraid/api/compare/v2.26.1...v2.26.2) (2021-09-09)


### Bug Fixes

* add configErrorState to graphql ([ce7b3d9](https://github.com/unraid/api/commit/ce7b3d962457f2b8f87e32c57b74200214eda19c))

### [2.26.1](https://github.com/unraid/api/compare/v2.26.0...v2.26.1) (2021-09-08)


### Bug Fixes

* use string for anon  mode ([65d6541](https://github.com/unraid/api/commit/65d65412605c58d313df5128a723d62e0e110ac6))

## [2.26.0](https://github.com/unraid/api/compare/v2.25.0...v2.26.0) (2021-09-08)


### Features

* use local server data for /servers when in anon mode ([34da448](https://github.com/unraid/api/commit/34da448f1e778a3943bb1bf399fde1c58f0d8968))

## [2.25.0](https://github.com/unraid/api/compare/v2.24.1...v2.25.0) (2021-09-08)


### Features

* add configErrorState ([a6b1657](https://github.com/unraid/api/commit/a6b1657062c1cc600ec8913bf1589bcb1ea8dd17))
* add support for anonMode ([eb005e7](https://github.com/unraid/api/commit/eb005e7d587f270a2092e0be94152f39377becd4))


### Bug Fixes

* add message on good exit ([7003921](https://github.com/unraid/api/commit/7003921178e990ecea94c2736543f5700646df5c))
* log when API dies ([06e8161](https://github.com/unraid/api/commit/06e8161fa9e4de0e552b482939abf448884f94a8))

### [2.24.1](https://github.com/unraid/api/compare/v2.24.0...v2.24.1) (2021-09-07)


### Features

* commonjs -> esm ([632a9d1](https://github.com/unraid/api/commit/632a9d15384eae75b2d39cf0bf104356b0323213))


### Bug Fixes

* ensure vms summary is also published to ([7fa0cb0](https://github.com/unraid/api/commit/7fa0cb0f3f45accd69500a6724afa9c7bb79272d))
* ensure we catch non errors for libvirt ([e360acf](https://github.com/unraid/api/commit/e360acf2d12cfdae3cb5e3e4593d474d0910ec30))
* invalid is not no/yes. ([f60cb1a](https://github.com/unraid/api/commit/f60cb1a9f59d36d07129ce00b6bc2be8e9d9ecd1))
* publish registation event on key file update ([6340967](https://github.com/unraid/api/commit/634096745881ecee9721c124dcf1fd48a2970dab))
* rename eslint config js -> cjs ([52c5bed](https://github.com/unraid/api/commit/52c5bed0af4b1f7f04802c1550cb0cea242d0e70))

## [2.24.0](https://github.com/unraid/api/compare/v2.23.5...v2.24.0) (2021-08-30)


### Features

* add vms count ([a0a2dae](https://github.com/unraid/api/commit/a0a2dae2a0170201cace18d35cc96efedbabcf46))
* add vms count to graphql ([0af7a56](https://github.com/unraid/api/commit/0af7a565fdd7fe7f0a6b61a44ee6a7c313dea43f))


### Bug Fixes

* cli test ([9bbcee8](https://github.com/unraid/api/commit/9bbcee8093722bb9cf8e43d81ab221ef140200dc))
* if libvirt throw incorrect connection pointer then reconnect ([b887fe2](https://github.com/unraid/api/commit/b887fe2d8dd114564aff03c540d5939da75eb963))
* remove loading external permissions ([90f04eb](https://github.com/unraid/api/commit/90f04eb5a0b0c489b8d70bcdaaa116426c9675b4))
* use native cp to handle switch-env ([e0c13cc](https://github.com/unraid/api/commit/e0c13cc4c1f4c05a575d642f2ace21e7873991f5))

### [2.23.5](https://github.com/unraid/api/compare/v2.23.4...v2.23.5) (2021-08-24)

### [2.23.4](https://github.com/unraid/api/compare/v2.23.3...v2.23.4) (2021-08-19)


### Bug Fixes

* don't log my_servers config ([79874dd](https://github.com/unraid/api/commit/79874dd838b27793f5132360a3258225da264dd5))

### [2.23.3](https://github.com/unraid/api/compare/v2.23.2...v2.23.3) (2021-08-19)


### Bug Fixes

* allow localhost as CORS origin ([14935b2](https://github.com/unraid/api/commit/14935b2bc3a099d57ebf92f4c5ee54d406d03e50))

### [2.23.2](https://github.com/unraid/api/compare/v2.23.1...v2.23.2) (2021-07-22)


### Bug Fixes

* subscribe to servers ([c657eef](https://github.com/unraid/api/commit/c657eef52cd8a47ed64e1623e4cc04780cbc6607))

### [2.23.1](https://github.com/unraid/api/compare/v2.23.0...v2.23.1) (2021-07-21)


### Bug Fixes

* hypervisor started path ([3555473](https://github.com/unraid/api/commit/3555473fed71ac1d37da4d9ae7a1689f3137d3d0))

## [2.23.0](https://github.com/unraid/api/compare/v2.22.3...v2.23.0) (2021-07-19)


### Features

* on relay 401 delete API key ([7c148fe](https://github.com/unraid/api/commit/7c148fe77a250234ce1c17593b60d873b54afeb2))


### Bug Fixes

* export getHypervisor ([52a9ade](https://github.com/unraid/api/commit/52a9ade754bb320c8e133fbce701d9468a44581f))
* vms permissions ([23ae9a5](https://github.com/unraid/api/commit/23ae9a57a1bc74ddff524372275e9900d1175e9f))
* vms subscription bound to wrong path ([b26bd38](https://github.com/unraid/api/commit/b26bd38b363886ca48c9dd8b009d1518b24e0575))
* watch for libvirt changes and reload connection ([a0efa46](https://github.com/unraid/api/commit/a0efa46f39d1c12a5a1c74675113caef28cec7ab))
* watch libvirt for changes ([c230209](https://github.com/unraid/api/commit/c230209e1e90c4c3aa78e008b26a0b6047cd6358))

### [2.22.3](https://github.com/unraid/api/compare/v2.22.2...v2.22.3) (2021-07-14)

### [2.22.2](https://github.com/unraid/api/compare/v2.22.1...v2.22.2) (2021-07-14)

### [2.22.1](https://github.com/unraid/api/compare/v2.22.0...v2.22.1) (2021-07-14)


### Bug Fixes

* vms permissions ([f516e51](https://github.com/unraid/api/commit/f516e51661ebf0274e8a81d8488377f612c609ed))

## [2.22.0](https://github.com/unraid/api/compare/v2.21.4...v2.22.0) (2021-07-14)


### Features

* replace ws custom-socket with graceful-ws ([95d7f99](https://github.com/unraid/api/commit/95d7f99643791aca40b2c7c927a67b6b096e2545))


### Bug Fixes

* typo ([5d06f22](https://github.com/unraid/api/commit/5d06f227effa2e23f1b9b34fd8782b78c8be8bd2))
* update bundle deps ([0e12f00](https://github.com/unraid/api/commit/0e12f001ff0de3a3cf8a2dc0011550efd96e3b12))
* wait 5s before connecting to internal socket ([945820b](https://github.com/unraid/api/commit/945820bc915a6970f6fbb3224ad02f639616c010))

### [2.21.4](https://github.com/unraid/api/compare/v2.21.3...v2.21.4) (2021-07-12)


### Bug Fixes

* add tsc check to cover:types ([24a74a5](https://github.com/unraid/api/commit/24a74a52bb42bdff8313122fc0da135971f5e569))
* update docker-events ([b7ce6f8](https://github.com/unraid/api/commit/b7ce6f803f189303231d529268ab11834d369e0b))

### [2.21.3](https://github.com/unraid/api/compare/v2.21.2...v2.21.3) (2021-07-08)


### Bug Fixes

* update hash var ([7193644](https://github.com/unraid/api/commit/71936449496d5af28c6b64c64a266b95d9fad0e3))
* update hash var ([8eb4296](https://github.com/unraid/api/commit/8eb4296ab6ad2e4898dc3c45de40dc55e4dab8ff))
* update hash var ([19114ea](https://github.com/unraid/api/commit/19114ea3a097066175ace10cc207f4b74eb44d13))

### [2.21.2](https://github.com/unraid/api/compare/v2.21.1...v2.21.2) (2021-07-06)


### Bug Fixes

* ensure dotenv is read before getting environment ([a19b5a9](https://github.com/unraid/api/commit/a19b5a9c43860b1b4f9c94340483d0352bf802d3))
* get esm modules bundled correctly ([22b5b8b](https://github.com/unraid/api/commit/22b5b8bfc7149b6fdfa26884bea9c1be1777fb1f))
* permissions name typo ([ee197f9](https://github.com/unraid/api/commit/ee197f9610b0ba0a8e3109684d6baf0e6913f584))

### [2.21.1](https://github.com/unraid/api/compare/v2.21.0...v2.21.1) (2021-07-05)

## [2.21.0](https://github.com/unraid/api/compare/v2.20.1...v2.21.0) (2021-07-05)


### Features

* optimise services endpoint ([396a827](https://github.com/unraid/api/commit/396a827bd1603597ccf382c26b63dd40b80c635e))


### Bug Fixes

* better error message ([396ce26](https://github.com/unraid/api/commit/396ce2607dde53a24d1be93874d8827871400a19))
* ensure ssl cert and my-servers-config are watched ([0ab765b](https://github.com/unraid/api/commit/0ab765b8326216135f9058f7117b409fbf496145))
* ensure switch-env writes the newEnv not staging ([32938d7](https://github.com/unraid/api/commit/32938d747d6a9250ce9ba39b458505da7a8179d2))
* ensure we do a case insensative check for origins ([a097b7c](https://github.com/unraid/api/commit/a097b7ceae62af83662ff507588c1b2eae76bafc))

### [2.20.1](https://github.com/unraid/api/compare/v2.20.0...v2.20.1) (2021-06-30)


### Bug Fixes

* generated keys should be 64 chars not 58 ([492cc77](https://github.com/unraid/api/commit/492cc7755c5b3d13b98f77219d0bf701f94cc8e2))
* log the current origin ([54be8e8](https://github.com/unraid/api/commit/54be8e831bbb75b299ded3f5efb17dd0f389c67d))
* origin check with ports ([97f029d](https://github.com/unraid/api/commit/97f029dbc6e5464a6671c9ac22b38cce79f9d88d))

## [2.20.0](https://github.com/unraid/api/compare/v2.19.9...v2.20.0) (2021-06-30)


### Features

* add notifications mutation ([03a150b](https://github.com/unraid/api/commit/03a150b4edc58810e56fc6977ec126e41f28e9a0))


### Bug Fixes

* account for keys missing ([d5744a6](https://github.com/unraid/api/commit/d5744a603a7481a938061a51d56e36469bb1bc26))
* add notifications mutation to schema ([d68da1d](https://github.com/unraid/api/commit/d68da1d2aa2237f0fb65dce3c0e5f6bae9c6208f))
* add notifier to api lookup ([e5b2e58](https://github.com/unraid/api/commit/e5b2e585652165748453f9f5eda19cc76a5e0361))
* add status field to sendNotification ([bb3e438](https://github.com/unraid/api/commit/bb3e43884416adf6e229488d09222e8807bfa42a))
* api-manager not writing out notifier key if upc one exists ([4fd2886](https://github.com/unraid/api/commit/4fd288616c803c708d8fe8869f0683b6c950b1d2))
* cut down the generated keys after whole key ([6a2ccfc](https://github.com/unraid/api/commit/6a2ccfc421662639f0a01cd8083c5af1465f2e26))
* export sendNotification correctly ([02203b3](https://github.com/unraid/api/commit/02203b3e53e6fd44deea5b8224a37d132561f0a7))
* misc changes to notifications ([79bba13](https://github.com/unraid/api/commit/79bba139c3b1c462b799916bdf501796b3b09c91))
* remove ports from origin check and add notifier bridge ([19e5c87](https://github.com/unraid/api/commit/19e5c87853c4cfdfc9e10421f70aae9995451d9d))
* sending notification ([26e5e51](https://github.com/unraid/api/commit/26e5e51539d82fb23ca84e561e3c6159c6f4339f))
* typo upc -> notifier ([f015841](https://github.com/unraid/api/commit/f0158416b966e5fc1c381845a40e1e9bc10b2e58))

### [2.19.9](https://github.com/unraid/api/compare/v2.19.8...v2.19.9) (2021-06-28)


### Bug Fixes

* add extra origins ([5e60b30](https://github.com/unraid/api/commit/5e60b301976aae5faa65e6b4551870c1d01ab973))
* add www.hash origin ([9134c66](https://github.com/unraid/api/commit/9134c663540f80700e897b8d915f1b5e18de7b38))

### [2.19.8](https://github.com/unraid/api/compare/v2.19.7...v2.19.8) (2021-06-28)


### Bug Fixes

* move origins file to data dir ([0e676bf](https://github.com/unraid/api/commit/0e676bf2dd872957b507d49a55548e2d6b4008b5))

### [2.19.7](https://github.com/unraid/api/compare/v2.19.6...v2.19.7) (2021-06-28)


### Bug Fixes

* os.uptime ([33a48ed](https://github.com/unraid/api/commit/33a48ed65505a820747cade0bb2da1038aab432d))

### [2.19.6](https://github.com/unraid/api/compare/v2.19.5...v2.19.6) (2021-06-28)


### Bug Fixes

* info.os.uptime ([103bddb](https://github.com/unraid/api/commit/103bddbbf0ba07b0977c3e7032a96838484ae4d8))

### [2.19.5](https://github.com/unraid/api/compare/v2.19.4...v2.19.5) (2021-06-28)


### Bug Fixes

* add vars permssions to my_servers role ([1f93bf3](https://github.com/unraid/api/commit/1f93bf3293e4e79e4578252eca22593e7699924d))
* in debug mode allow null origin ([1bdce52](https://github.com/unraid/api/commit/1bdce528cf784615888b80e3686eca446154891e))
* typo boolean flip ([4a7a5fa](https://github.com/unraid/api/commit/4a7a5faac82573f3e5b0c7e49663459e858174be))

### [2.19.4](https://github.com/unraid/api/compare/v2.19.3...v2.19.4) (2021-06-28)


### Bug Fixes

* remove duplicate .unraid.net in cert ([dabf45d](https://github.com/unraid/api/commit/dabf45df09db360adc7a4a3bd18937430245b3d8))

### [2.19.3](https://github.com/unraid/api/compare/v2.19.2...v2.19.3) (2021-06-28)


### Bug Fixes

* hash origin ([6c8d228](https://github.com/unraid/api/commit/6c8d228f2bcce1c4fff47de88f12dd171abb13c1))

### [2.19.2](https://github.com/unraid/api/compare/v2.19.1...v2.19.2) (2021-06-28)


### Bug Fixes

* duplicate CORS records and getting wrong hash for domain ([bd4a43c](https://github.com/unraid/api/commit/bd4a43c1771388f110f98c085e4b6314803b9244))

### [2.19.1](https://github.com/unraid/api/compare/v2.19.0...v2.19.1) (2021-06-28)


### Bug Fixes

* don't log CORS errors ([2312de2](https://github.com/unraid/api/commit/2312de2429d830b135c5d8537b8f10c707a35c9e))
* origins ([ea68758](https://github.com/unraid/api/commit/ea68758328ca993b42b5cd6f36f838358ee9f377))

## [2.19.0](https://github.com/unraid/api/compare/v2.18.5...v2.19.0) (2021-06-28)


### Features

* add origin checking for graphql ([2d7a70d](https://github.com/unraid/api/commit/2d7a70dc0c9a08ef28851f7e064a994b6b399942))


### Bug Fixes

* allow HTTP erorrs to be processed ([a82b922](https://github.com/unraid/api/commit/a82b922a0e2643b12394ca4c6f51fb916f0e0355))
* don't attempt to disconnect internal if its not connected ([2609c67](https://github.com/unraid/api/commit/2609c6708a1230f370fd7c34fa52e04ca56c4fcc))
* don't fail if missing extra origin file ([1fb7c96](https://github.com/unraid/api/commit/1fb7c96fbceb01760fa7c1aeac19abf633f026e7))
* ensure toBoolean can't throw ([aa9b21a](https://github.com/unraid/api/commit/aa9b21aa4861a7d6a55c43b9924bc728c3fe8cae))
* ensure we don't crash when no cert or origin file exists ([f715f55](https://github.com/unraid/api/commit/f715f55c3b0931a968cb095e671df064e1cc3dd5))
* include node-forge in bundle ([a8efea9](https://github.com/unraid/api/commit/a8efea933ee37207e71785b62d38d2fc4b0d028e))
* jq script ([a6d2a08](https://github.com/unraid/api/commit/a6d2a08028dd532c65b21efbb9babddf6e39d7be))
* missing message string ([3fd69ce](https://github.com/unraid/api/commit/3fd69ce4758ff16e332df0ab0a9940fef42c5578))
* process HTTP errors on custom socket ([51fc374](https://github.com/unraid/api/commit/51fc374975869d52610fab65364c20809c5008e6))
* update apt before installing libvirt ([70ec3db](https://github.com/unraid/api/commit/70ec3dbfec84340d22d68fec348bc15d1de8367c))
* use GITHUB env for git short hash ([b964ae9](https://github.com/unraid/api/commit/b964ae9f737c37aa761358c0474db08e4b43a97b))
* use seconds not ms for sleep ([4da6b28](https://github.com/unraid/api/commit/4da6b285a3b804698be712c8eaa3e0e1d6eac083))

### [2.18.5](https://github.com/unraid/api/compare/v2.18.4...v2.18.5) (2021-06-21)


### Bug Fixes

* 200 === OK ([18628f2](https://github.com/unraid/api/commit/18628f2f5ea409d5b7d41e3a8ca49fe632097ced))
* always use ws status codes ([8903f30](https://github.com/unraid/api/commit/8903f303c13cad8d1f3b9f8ded0db11dd0249158))
* handle ws errors ([c7035e8](https://github.com/unraid/api/commit/c7035e8bee5243b091f4fdbe9db23236b6e6d50d))
* use HTTP status codes for ws ([ba9ef24](https://github.com/unraid/api/commit/ba9ef2414205a6ef56ae804c64a040a9dcd6c565))

### [2.18.4](https://github.com/unraid/api/compare/v2.18.3...v2.18.4) (2021-06-16)


### Bug Fixes

* add disks as resolver ([0b99e06](https://github.com/unraid/api/commit/0b99e066d794591cae12a156889d866fb11c2225))
* only lookup disk temp when requested ([cd245c9](https://github.com/unraid/api/commit/cd245c9063f6aac65d7cd4ffec73f61b33c2e9e3))
* return data on disks endpoint ([8122dc0](https://github.com/unraid/api/commit/8122dc0fa9c0006f7c47f49c97bc890e9ad6f098))

### [2.18.3](https://github.com/unraid/api/compare/v2.18.2...v2.18.3) (2021-06-07)


### Bug Fixes

* missing my_servers permissions for software-versions ([ce61766](https://github.com/unraid/api/commit/ce617667c644d19a674cdb135b575a1920a7128e))

### [2.18.2](https://github.com/unraid/api/compare/v2.18.1...v2.18.2) (2021-06-07)


### Bug Fixes

* missing my_servers permissions for machine-id ([2f33491](https://github.com/unraid/api/commit/2f334916049eeb5fa75c311daad5b4777404cc4c))
* missing my_servers permissions for unraid-version ([5781dc8](https://github.com/unraid/api/commit/5781dc864ad01c38fd696a83287a9d608970dfc6))

### [2.18.1](https://github.com/unraid/api/compare/v2.18.0...v2.18.1) (2021-06-07)


### Bug Fixes

* missing my_servers permissions for os ([3b18129](https://github.com/unraid/api/commit/3b181293ef9ae2bf21928c2962cc129fd896c1e5))

## [2.18.0](https://github.com/unraid/api/compare/v2.17.4...v2.18.0) (2021-06-07)


### Features

* add autoStart to vm endpoint ([47d2c32](https://github.com/unraid/api/commit/47d2c3290070a9a82a97371b44dc214c7c706264))


### Bug Fixes

* add 'servers' permission to my_servers key ([715f94a](https://github.com/unraid/api/commit/715f94ab9862617bceea9c2b2a552e167b6092bb))
* add en_US as fallback for display.locale ([b97e2f5](https://github.com/unraid/api/commit/b97e2f5bf6e6449c0271cd64e7fc8d8653231c3f))
* add logging to switch-env ([ff6bf14](https://github.com/unraid/api/commit/ff6bf141db23fa77e3b47ef75e1b377483e772a3))
* add permission to admin role ([81e064d](https://github.com/unraid/api/commit/81e064da4ec29a0d43a5458375a6f9ff12005a9b))
* add quotes to serialized upc ([17c9f6e](https://github.com/unraid/api/commit/17c9f6e09b006225b4248f75df16167a97ed95fe))
* add unraid api version to header ([2f4a8f9](https://github.com/unraid/api/commit/2f4a8f9e8deec5f559d00f2eb70542f287ec1aae))
* allow upc keys to access display endpoint ([ba13ff9](https://github.com/unraid/api/commit/ba13ff94bf6c2dbd7eda59df0aecaccf343f363a))
* convert libvirt code to new library ([3acb9a3](https://github.com/unraid/api/commit/3acb9a3f7f3c0c06b0dfba3696e4ee5472d0c212))
* don't build nexe ([b2d59f3](https://github.com/unraid/api/commit/b2d59f34c3ad01c55c8be848a42cca9ae6d012f5))
* dont reconnect on 401 ([83cbd67](https://github.com/unraid/api/commit/83cbd678f764954ca316c5c74e792163a66c2be3))
* dynamically get the current environment ([4c72ffa](https://github.com/unraid/api/commit/4c72ffac19d47bbd6d0562fb6d647400710fd4af))
* ensure API key shouldnt care if my_servers exists ([2048d61](https://github.com/unraid/api/commit/2048d61a27d81633f4819c1b051769022c7fce01))
* ensure api manager reloads my_servers key ([223a6e6](https://github.com/unraid/api/commit/223a6e6bf42605ebe2716931250ca4edb12acce0))
* ensure correct env is shown if it's changed within app ([e9bebbb](https://github.com/unraid/api/commit/e9bebbbaa7e2a1ae9f2fe0e1f3a604f2588bef92))
* if we have multiple pids return newest ([17251f8](https://github.com/unraid/api/commit/17251f83a98201b3503ad15bf5e01e2b99419e4d))
* imports ([d19eb80](https://github.com/unraid/api/commit/d19eb80f14220971924ee2fd9d07fc4d9455dc3e))
* include libvirt-devel in workflow ([75fb835](https://github.com/unraid/api/commit/75fb835851c54b60354766ed8306c37740e73d7f))
* include quotes around env name ([a87bd92](https://github.com/unraid/api/commit/a87bd9255f7f0efdf855d3b6e749e4bec5a7d726))
* incorrect key being passed ([5858398](https://github.com/unraid/api/commit/58583985dc2af657a5a69b9a566eb05f9ccdc16d))
* keep quotes when serializing upc key ([9ac16c8](https://github.com/unraid/api/commit/9ac16c80865baf6862f4f4741920a14dc0c8e698))
* on registation key change allow api manager to reload sockets ([c238b3c](https://github.com/unraid/api/commit/c238b3c0ae4e363c932e992439584f3030b4add8))
* only emit key expired event if the key just expired ([3ac1fdb](https://github.com/unraid/api/commit/3ac1fdb8f9fbe92fd25c42b38f979b69a47b61be))
* os.uptime timestamp ([71e97c9](https://github.com/unraid/api/commit/71e97c9c616e6273b64b57d1c3e7f0559fd97336))
* preserve quotes when saving my servers config file ([34a0335](https://github.com/unraid/api/commit/34a03354bf379d96a699fcbccfb6a0c202ca92f1))
* reconnect to internal relay on my_servers reload ([4eaf0a4](https://github.com/unraid/api/commit/4eaf0a472a06e9d4c176ed41265cdcf65ffbccb7))
* reconnect to mothership's subcription endpoint on key change ([d537c6e](https://github.com/unraid/api/commit/d537c6ee8bd27d89be3cc224023b624bb7b337b6))
* reconnect to sockets on key change ([607ff46](https://github.com/unraid/api/commit/607ff4666e036029ae05676f9bf219241bbd63ab))
* return correct owner for endpoint ([b1a58f9](https://github.com/unraid/api/commit/b1a58f951156e98ee35f4fe7d35124896281b5be))
* return local server if no my_server key exists ([ef78616](https://github.com/unraid/api/commit/ef7861691c35d97fa7e5b7017e20fca7c11bed43))
* return null is owner is signed out of myservers ([9a41a3d](https://github.com/unraid/api/commit/9a41a3d79a735ae827f7d279b35ee1134eb94e84))
* switch libvirt libs ([36a1f58](https://github.com/unraid/api/commit/36a1f58632849e4130d92e2187f22ce2decbfb02))
* switch to dedent-tabs ([1495ffd](https://github.com/unraid/api/commit/1495ffddd3030497ed6fafdfc68f40c254c67507))
* switch-env ([335daba](https://github.com/unraid/api/commit/335dabaea0184225d70002f27f84ba5ec313283c))
* try disconnecting/reconnect to relay from watcher ([ad750f5](https://github.com/unraid/api/commit/ad750f5753f1fdf42c6330c63e4f23a523fadbfb))
* use -1 for service account ids ([1218f9f](https://github.com/unraid/api/commit/1218f9f950a89d32be5a9b66edb2b640ada8e71f))
* use 401 when disconnecting for invalid api key ([ee21f0b](https://github.com/unraid/api/commit/ee21f0b2ecbc17ea6bdcc203c524180a4b7fd0db))
* use debug log level if debug flag used ([eb5e0af](https://github.com/unraid/api/commit/eb5e0afb7deaeb8bf4ca6ead8be6ba7e936acb87))
* use display.locale not display for locale value ([98432a4](https://github.com/unraid/api/commit/98432a4059263aee6e7d0b94eeb1fa9d6ef4e3eb))
* use env from user before flag ([e37eac6](https://github.com/unraid/api/commit/e37eac662c9cc27e4a3aeae4f882a7a8aa0c58db))
* use service account for internal user and fix root permissions ([26ddc52](https://github.com/unraid/api/commit/26ddc520edfc456f8c02aefdbbb908e500523aba))
* use subscription client reconnect method ([5d764d8](https://github.com/unraid/api/commit/5d764d8056397e9734b63b6991897e3fa12c46d4))
* use the exact version nexe wants ([10cce9b](https://github.com/unraid/api/commit/10cce9b16fc367c73a8e6a14764d10fc91accccb))
* write correct file on switch ([19b26d7](https://github.com/unraid/api/commit/19b26d7843f92e046450c82ae055484b2b0eb723))
* wrong env and dedent ([58a3813](https://github.com/unraid/api/commit/58a381316ed59bd0e035574a908dfb4db0f69640))
* wrong import ([bd1cbb5](https://github.com/unraid/api/commit/bd1cbb566d31ff09e5c6c9b842fedc8d418ac0d2))

### [2.17.4](https://github.com/unraid/api/compare/v2.17.3...v2.17.4) (2021-05-14)


### Bug Fixes

* append upc key to cfg instead of rewriting whole file ([2c6d9f9](https://github.com/unraid/api/commit/2c6d9f92fa9327a06a70ae0e7a90097a37b6f8e2))

### [2.17.3](https://github.com/unraid/api/compare/v2.17.2...v2.17.3) (2021-05-14)


### Bug Fixes

* don't throw when machine-id is missing ([97042a8](https://github.com/unraid/api/commit/97042a8bed84397a8e5f3dde4c9ba02815ff2c04))

### [2.17.2](https://github.com/unraid/api/compare/v2.17.1...v2.17.2) (2021-05-13)


### Bug Fixes

* get machine id should not be fatal ([a15f3c8](https://github.com/unraid/api/commit/a15f3c8c827effd21f2a7c638af5d5566d90c929))
* use flash for .zip check not node_base_directory ([5b4d164](https://github.com/unraid/api/commit/5b4d164f6944a283b021bec6fa3b8a0dc57a758a))

### [2.17.1](https://github.com/unraid/api/compare/v2.17.0...v2.17.1) (2021-05-13)


### Bug Fixes

* @typescript-eslint/comma-dangle ([5917dcb](https://github.com/unraid/api/commit/5917dcb17df9d81016e9402c90eb554e6acc364b))
* add logs for invalid api key ([3f9c083](https://github.com/unraid/api/commit/3f9c083d3dec1296dffa7cfb18882dbbdcc54be2))
* add other endpoints to upc permissions ([f821c0e](https://github.com/unraid/api/commit/f821c0e258a3a786e1a8fb410929069c2e983ccf))
* add upc key to api-manager on load not only when it's missing ([a7fb0df](https://github.com/unraid/api/commit/a7fb0dfba1527d99b9e756e1a9e23c8f509c8859))
* add upc permissions ([d8c67b3](https://github.com/unraid/api/commit/d8c67b36c0c6dd7c6ba0dff9a1865c5d3630438d))
* allow github actions zips in the install process ([fd98e78](https://github.com/unraid/api/commit/fd98e7884116074842b3812281986616e1679452))
* grants[role] is undefined ([5b9299c](https://github.com/unraid/api/commit/5b9299c20b670a55bf7e685ad0c0ba243137561a))
* non user accounts throwing null for id/description and disable silly logging by default ([0524c2e](https://github.com/unraid/api/commit/0524c2eb80697b9d3f3008d4d9d12a6829fe8e63))
* prevent cli pulling in all of app ([4306145](https://github.com/unraid/api/commit/4306145123298902110c190e865f1865a4eefe8b))
* upc not having own group ([93b75a5](https://github.com/unraid/api/commit/93b75a5e4cd445548f9b71853dfbbd3d53c3b27b))
* use paths helper instead of raw path ([63ca181](https://github.com/unraid/api/commit/63ca1816ebd95c42edf7ac4081c95d7e8a688a5d))
* zip path ([a23468e](https://github.com/unraid/api/commit/a23468eb24cbc9f977a81741786bb7ec6979da7e))

## [2.17.0](https://github.com/unraid/api/compare/v2.16.1...v2.17.0) (2021-05-06)


### Features

* add key-file watcher and registation subscription endpoint ([ee6b946](https://github.com/unraid/api/commit/ee6b946be428c62631e8a34e56312ba90ad19205))
* add regState ([eb99cd2](https://github.com/unraid/api/commit/eb99cd26862f5d1e27bb645fc0c3b60f5474903e))
* add switch-env to cli ([3218cea](https://github.com/unraid/api/commit/3218ceaa75dfd0bff9e896788a8f14df941111db))
* add upc api key ([864d1b2](https://github.com/unraid/api/commit/864d1b28b75b49c433de3c1f87b6377ad1fb26f9))
* myservers config watcher ([8ba91fd](https://github.com/unraid/api/commit/8ba91fd263d49c61771723473b159600e4264ba1))


### Bug Fixes

* add "Invalid" type to registationType enum ([c057e05](https://github.com/unraid/api/commit/c057e051960710abf28a0a9786c5a03a87c9620e))
* add ENOKEYFILE to RegistrationState ([21fc61c](https://github.com/unraid/api/commit/21fc61cce349cd558afc995b57638ad93d0267fd))
* add owner subscription and fix registration typo ([238016f](https://github.com/unraid/api/commit/238016fbfd2abb571ac60ae7b7765b1df058bac8))
* add vars sub ([55735ac](https://github.com/unraid/api/commit/55735ac549faaab45991018f6812f966ed12437b))
* always lookup keyfile if it has path otherwise public empty ([8215a7c](https://github.com/unraid/api/commit/8215a7c2437fd51cd71ca70784357f5340a230e9))
* always use varState for regFile path ([1263b9b](https://github.com/unraid/api/commit/1263b9b52ded945322bc8332e09ff65080038bac))
* capital ([af1142c](https://github.com/unraid/api/commit/af1142c24c686b8a5d3c9968ba3940a55728106b))
* cfg file not being updated correct with upc api key ([44d9013](https://github.com/unraid/api/commit/44d90135a9e77d311e93c3cd501440a012e1a685))
* Clarify port forwarding error message ([57bb936](https://github.com/unraid/api/commit/57bb9366634be24c98c86ad29f4999bdf860937e))
* emit owner event if we get an update for servers from mothership ([5943dac](https://github.com/unraid/api/commit/5943dac53be40c7a971ff43f3d80258b3468b7ea))
* emit owner event if we update servers from mothership ([4a47ddc](https://github.com/unraid/api/commit/4a47ddc8b2ed50aab8658e921e5431f04cec9ef8))
* ensure invalid config is false ([e2ae9a3](https://github.com/unraid/api/commit/e2ae9a3199092bb122ac719606d86cd3ba9805a6))
* ensure processChange has new varState values ([911ae77](https://github.com/unraid/api/commit/911ae77011b1faf69c4308fba05fcd0fc68bdac9))
* ensure regex on regFile is run globally ([b92ce67](https://github.com/unraid/api/commit/b92ce677688926b20e70b35f57668a9d4ec186d4))
* ensure registration.type is always uppercase and uses regTy as fallback when null ([f52d85c](https://github.com/unraid/api/commit/f52d85ca42c05c4514e3cc64c9e4bfc5d47ef031))
* ensure regTy is always uppercase ([db13e10](https://github.com/unraid/api/commit/db13e10e9fa476b3f3d09b2f50d1411fefb68bbc))
* Ensure there is sufficient free space on the flash drive before enabling flash backup ([e1e1132](https://github.com/unraid/api/commit/e1e113214389642f1f845e9c1bff29255361a953))
* ensure upc api key is only 64 chars ([70d079b](https://github.com/unraid/api/commit/70d079b05edbe252e8951c11707c2c70134c85f5))
* ensure varState is watched for registration events ([e9889f5](https://github.com/unraid/api/commit/e9889f56557cbf7f7d80e5ab66fcd95763dbea19))
* ensure we encapsulate registration publish in registration field ([9719587](https://github.com/unraid/api/commit/9719587bca63f43135e7f036c38fceeaeb2f7d57))
* ensure we only allow the current key to publish ([c72c1fd](https://github.com/unraid/api/commit/c72c1fdf6927d323833b060fc6a8091997bbe7f4))
* ensure we return an empty string when key file is missing ([3f2707c](https://github.com/unraid/api/commit/3f2707cff12ff91c8808167d7466749b39a71d72))
* ensure we wait for file to finish being written before emitting event ([141f83d](https://github.com/unraid/api/commit/141f83d6cbfa143a2ff07511d650c117c824cb92))
* Enum "registrationType" cannot represent value: "INVALID" ([3719b06](https://github.com/unraid/api/commit/3719b06c50da6abdb618f33fe0cd05029bc16e48))
* get key type from file not store on publish ([0723c66](https://github.com/unraid/api/commit/0723c66986fabaf5c9da17a98105792e639fdfe5))
* getKeyfile import/export ([2608687](https://github.com/unraid/api/commit/2608687d694c556e5c97224f3b03372911ba1513))
* include btoa and graphql-iso-date deps in build ([b27c6ed](https://github.com/unraid/api/commit/b27c6ed670b49de2782f24148562eb77ea45825f))
* include needed imports ([be6ffc1](https://github.com/unraid/api/commit/be6ffc1fbab6108d044b1ae0bed75814a4947658))
* include state in registration subscription ([038dfac](https://github.com/unraid/api/commit/038dfac213429b6f15ff4f784b3808652f8e56c1))
* key file being read as non-binary ([c437952](https://github.com/unraid/api/commit/c4379521205103c27dfda2d9ac0a893f4b829a0d))
* keyDirectory being empty on startup ([3cff71f](https://github.com/unraid/api/commit/3cff71f3d102e6a19c8c0402821052d15000c988))
* log when registration is published to ([7d3e168](https://github.com/unraid/api/commit/7d3e1685765fb257458fbee9dbc0c25caa92bdb4))
* lower ka to prevent socket stalling ([192be53](https://github.com/unraid/api/commit/192be53fbd1deddce018e557ce9d1431dc7d7135))
* nest owner field in publish ([d7496fe](https://github.com/unraid/api/commit/d7496fecb1b0866451ddad561bf640c7e31bffa7))
* nest registration field in publish ([a7a80c1](https://github.com/unraid/api/commit/a7a80c1243454f2389ffee0ad1de5da32e3c62b2))
* nest vars endpoint publish ([6c9df73](https://github.com/unraid/api/commit/6c9df73da45a6fdfddde88b00f9ded1724d46e63))
* registration not being published to if key file emits add event ([4632f35](https://github.com/unraid/api/commit/4632f35b24c2d1f95bf87d805e396ab69ee83df8))
* registration typo ([50412fa](https://github.com/unraid/api/commit/50412faf5c5c0c1063820a063200ddda9a263b11))
* remove unneeded cron action ([39f49d3](https://github.com/unraid/api/commit/39f49d3e4242496e8a5f1fb6a9bf913952918d03))
* rework registation watcher ([a6a32ef](https://github.com/unraid/api/commit/a6a32ef673dddb852d30bc5fa2733b33e74ba9aa))
* set upc as well ([db1274d](https://github.com/unraid/api/commit/db1274d0ca1eba9de806aca36f1689f2f0556400))
* switch-env not detecting env ([9ec53ed](https://github.com/unraid/api/commit/9ec53ed4331dd9aa174a1e6281e40a4ab5cb2fd7))
* typo, remove dirname ([20847dd](https://github.com/unraid/api/commit/20847ddd152e12fda5bd855f61560c2901f628ad))
* upc apikey path ([cb87d33](https://github.com/unraid/api/commit/cb87d336b718dfa0630acbe9aba51f83d11e59af))
* use || not ?? as value is empty string ([e9fa31f](https://github.com/unraid/api/commit/e9fa31f28e46a08fbe69626bc10041e2301bbca8))
* use btoa to read key file ([91c849c](https://github.com/unraid/api/commit/91c849c9f22b841a69df1005c7bdcb4399505f82))
* use correct event name for var state and simplify registation watcher ([c30c2a8](https://github.com/unraid/api/commit/c30c2a89725d3e39ae1ef65a92273661470fb22c))
* use new data from bus watcher ([f9eac11](https://github.com/unraid/api/commit/f9eac11ff64ce794d0197dc3cf3c2619f2776c5d))
* use new data from bus watcher ([41197a6](https://github.com/unraid/api/commit/41197a63b20335d8d7fc1d020a1e530885d6e019))
* use port 22 or fallback port 443 for ssh; display backup errors on settings page ([b31cd5d](https://github.com/unraid/api/commit/b31cd5dd16fec7e1548ec44dce49929324a07196))
* use var not varstate on hostname change ([c361fe7](https://github.com/unraid/api/commit/c361fe73ebe9fe8fd8853e58826fd130ea607d5e))
* var subscription ([e557935](https://github.com/unraid/api/commit/e5579358d39fb2c0b9a79deab5a4e6ffbde02441))
* wait 100ms before returning the registation state incase varState is in flight ([03fe6c0](https://github.com/unraid/api/commit/03fe6c082ed96b7a1dc23e4872d2335d66667878))
* watched key firing wrong filePath ([503df44](https://github.com/unraid/api/commit/503df44ee4ef0842d56dc849971f0082d5d351d9))

### [2.16.1](https://github.com/unraid/api/compare/v2.16.0...v2.16.1) (2021-04-16)


### Bug Fixes

* add PCIe to DiskInterfaceType ([90b4f2d](https://github.com/unraid/api/commit/90b4f2dd40889a9e58c3e4be3fba3384b0e9d852))
* deleting node source files for nexe ([3cf4f91](https://github.com/unraid/api/commit/3cf4f918d365fdba613716120d17699457703c6b))
* replace - with = in keyfile ([07207b8](https://github.com/unraid/api/commit/07207b87f3b494bbe5872f16f85f65fe4fbf8524))
* set display.locale to en_us by default ([1414875](https://github.com/unraid/api/commit/14148754d2e38c7d1098f7a3195dad85b9b214a9))

## [2.16.0](https://github.com/unraid/api/compare/v2.15.58...v2.16.0) (2021-04-14)


### Features

* add locale to display ([5f89218](https://github.com/unraid/api/commit/5f8921856ca6658244d45723297a60d1d389e08c))
* add owner query endpoint ([f3db1b0](https://github.com/unraid/api/commit/f3db1b022c80997208df65bb484f44290143078f))
* crash reporting enabled query/subscription endpoint ([dc463d1](https://github.com/unraid/api/commit/dc463d11ac8f52dc6457cda10c5836959c7b9444))
* flash query endpoint ([4092872](https://github.com/unraid/api/commit/409287260bf89f5ce89b48b8ff80296784793ecf))
* headermetacolor setting ([a5df764](https://github.com/unraid/api/commit/a5df76416cb16bb97df7583cca3ab2dd9b75f96f))
* owner query endpoint ([e2690cc](https://github.com/unraid/api/commit/e2690cc18fa06cbab6ac27d1a2237e6d7f3d1767))
* registration query endpoint ([eb5272c](https://github.com/unraid/api/commit/eb5272c998a18e11b1f4b9ba619a2bf8b1b7d233))


### Bug Fixes

* add flash and registration query resolvers ([6e993d5](https://github.com/unraid/api/commit/6e993d5cf2c88ba38d166712f3f0c7c64db6c807))
* add flash types ([736fdd0](https://github.com/unraid/api/commit/736fdd0a0332fe6bfb1db505d2272b6e29018b53))
* add new endpoints to permissions ([4451931](https://github.com/unraid/api/commit/44519316df96935689b11f7f7c0550a4e0e0bc88))
* add Owner type to server ([412bea8](https://github.com/unraid/api/commit/412bea806ed6471bb0771f0a6e6ef9592161e07c))
* child loggers ([db5aaf0](https://github.com/unraid/api/commit/db5aaf0c2e533eb77fb93e07b0e5f4548f9cc458))
* don't require an ID to subscribe to vars ([e0af94d](https://github.com/unraid/api/commit/e0af94d3cab1e3c6255e2412a1ae9acaec942740))
* ensure we return the correct server's owner ([24b66f8](https://github.com/unraid/api/commit/24b66f871eaf71f086ed757ae72a0a076d2a5976))
* flashbackup should generate any missing bz*.sha256 files ([aa484dc](https://github.com/unraid/api/commit/aa484dc156e877bc935d64624ab9e233ed498ef5))
* flashbackup will now trap for missing bz files ([3ff51ab](https://github.com/unraid/api/commit/3ff51ab6347dca74b0d80cffe47146fac85d3388))
* graphql files not being included ([7f31047](https://github.com/unraid/api/commit/7f31047a6d1602cd97e8150a4b7b6c5051640439))
* key contents having invalid characters ([4b7d73f](https://github.com/unraid/api/commit/4b7d73f8dd8159fd8b36988223fd5563fa4939d4))
* remove double start() during install ([4a3de31](https://github.com/unraid/api/commit/4a3de31a01e56d952324761977e023f93f4a12d8))
* removes extra colon from copy ([ab90d2a](https://github.com/unraid/api/commit/ab90d2a7aec6a7a1cfa3e751e47f9a3ec4447302))
* retry querying servers ([d6c269f](https://github.com/unraid/api/commit/d6c269f439590d3c8c0f6859cc294b871b1b4354))
* switch git to use port 443 ([1d5d60e](https://github.com/unraid/api/commit/1d5d60e158863343de4fe3b4c18bd542d7b96df6))
* update the support link ([1df7840](https://github.com/unraid/api/commit/1df7840a2a28a0907b1b0fddb0339331fb32247c))
* use correct type ([64ac6ba](https://github.com/unraid/api/commit/64ac6ba6704927549b94bc807e6a4531ad7c9979))
* **plg:** pass regGuid for EGUID validation ([fc96b41](https://github.com/unraid/api/commit/fc96b4179b5a020fabec0d671232096ac75b4e3d))

### [2.15.58](https://github.com/unraid/api/compare/v2.15.57...v2.15.58) (2021-04-01)


### Bug Fixes

* actually bail on outdated client ([f93924a](https://github.com/unraid/api/commit/f93924ad05d427f49dfda763c9fce1a87e2f1db7))
* if outdated disconnect from relay ([54be86d](https://github.com/unraid/api/commit/54be86d94e3859ac1fc676008c6e51c3f5efef80))

### [2.15.57](https://github.com/unraid/api/compare/v2.15.57-alpha.0...v2.15.57) (2021-03-31)

### [2.15.57-alpha.0](https://github.com/unraid/api/compare/v2.15.56...v2.15.57-alpha.0) (2021-03-31)


### Bug Fixes

* string contains O ([d87e4fd](https://github.com/unraid/api/commit/d87e4fd7a2cf61be5bf25fa745ebe9db6a6d0855))

### [2.15.56](https://github.com/unraid/api/compare/v2.15.56-alpha.2...v2.15.56) (2021-03-31)

### [2.15.56-alpha.2](https://github.com/unraid/api/compare/v2.15.56-alpha.1...v2.15.56-alpha.2) (2021-03-30)


### Bug Fixes

* don't clear old connection on reconnect ([958e3e4](https://github.com/unraid/api/commit/958e3e41759ff4c50bb8aa22a388c8541a3c89a4))
* ensure we exit on SIGTERM ([c72ef02](https://github.com/unraid/api/commit/c72ef02beaab7cca0d519dbd7a8f4125ed39de12))
* move onExit context to arrow function ([3ccc862](https://github.com/unraid/api/commit/3ccc8626bcbb30517b5d7d04694078c1f2213cbd))
* on process exit stop relay connection ([4123607](https://github.com/unraid/api/commit/41236070c75bdae2c2f194bc85bef6b3941cd0a8))
* switch process exit around ([3663aad](https://github.com/unraid/api/commit/3663aad7060541a3e50ad4ba29e5c67e09ef0eef))
* use SIGTERM for stopping gracefully ([d50f193](https://github.com/unraid/api/commit/d50f19344c6d80f8cc2503679046c2e31ad51404))

### [2.15.56-alpha.1](https://github.com/unraid/api/compare/v2.15.56-alpha.0...v2.15.56-alpha.1) (2021-03-29)

### [2.15.56-alpha.0](https://github.com/unraid/api/compare/v2.15.55...v2.15.56-alpha.0) (2021-03-29)

### [2.15.55](https://github.com/unraid/api/compare/v2.15.54...v2.15.55) (2021-03-29)


### Bug Fixes

* redo full release notes ([6a6d937](https://github.com/unraid/api/commit/6a6d937dd8a73de45c5939532b45e866708410ab))

### [2.15.54](https://github.com/unraid/api/compare/v2.15.54-alpha.1...v2.15.54) (2021-03-29)


### Bug Fixes

* use fullpath for release notes and log them for debugging ([6da8628](https://github.com/unraid/api/commit/6da862851271a7a94d346502946518b742e9b4ee))

### [2.15.54-alpha.1](https://github.com/unraid/api/compare/v2.15.54-alpha.0...v2.15.54-alpha.1) (2021-03-29)


### Bug Fixes

* add steps to start action ([7a673dc](https://github.com/unraid/api/commit/7a673dc0f8faafcf2f98a4eb350aef46c32198d4))
* default branch ([93b7146](https://github.com/unraid/api/commit/93b714613cbc66c3ae0deb980ef5a24be2605786))
* move if to single line ([92b5c0b](https://github.com/unraid/api/commit/92b5c0bc7d5694a39992ac5501416bdc93c31358))
* on master ([37984f9](https://github.com/unraid/api/commit/37984f93544c221c4a875ddb2c32645c03f90c50))
* skip duplicate runs in github actions ([2297a1e](https://github.com/unraid/api/commit/2297a1e16187ddf06ffedc8a02f42bcef1270280))
* use correct field ([da69a8c](https://github.com/unraid/api/commit/da69a8c193bb3a7a3392cd09766e59ac1616c5ef))

### [2.15.54-alpha.0](https://github.com/unraid/api/compare/v2.15.53...v2.15.54-alpha.0) (2021-03-29)


### Bug Fixes

* use GITHUB_REPOSITORY env for release notes ([19e14e8](https://github.com/unraid/api/commit/19e14e8a513a0df7b00e5469681cac2ebc407c50))

### [2.15.53](https://github.com/unraid/api/compare/v2.15.52...v2.15.53) (2021-03-28)


### Bug Fixes

* pre/release notes ([19ea157](https://github.com/unraid/api/commit/19ea157e2bad5139fa8ac8029cf8101410fdf7c4))

### [2.15.52](https://github.com/unraid/api/compare/v2.15.51...v2.15.52) (2021-03-28)


### Bug Fixes

* release notes ([9842ea1](https://github.com/unraid/api/commit/9842ea1149cd31350019d1616c1e5a6f505f8a97))

### [2.15.51](https://github.com/unraid/api/compare/v2.15.51-alpha.0...v2.15.51) (2021-03-28)

### [2.15.51-alpha.0](https://github.com/unraid/api/compare/v2.15.50...v2.15.51-alpha.0) (2021-03-28)


### Bug Fixes

* prerelease script ([97abc20](https://github.com/unraid/api/commit/97abc206d32508f2a48a15c5af29d6c9abc6cd72))

### [2.15.50](https://github.com/unraid/api/compare/v2.15.50-alpha.5...v2.15.50) (2021-03-28)

### [2.15.50-alpha.5](https://github.com/unraid/api/compare/v2.15.50-alpha.4...v2.15.50-alpha.5) (2021-03-28)

### [2.15.50-alpha.4](https://github.com/unraid/api/compare/v2.15.50-alpha.3...v2.15.50-alpha.4) (2021-03-28)

### [2.15.50-alpha.3](https://github.com/unraid/api/compare/v2.15.50-alpha.2...v2.15.50-alpha.3) (2021-03-28)


### Bug Fixes

* ensure we checkout the repo in the release stage ([962f4ef](https://github.com/unraid/api/commit/962f4ef1d3b9c1dd8a2668016e3dba4a64508e55))

### [2.15.50-alpha.2](https://github.com/unraid/api/compare/v2.15.50-alpha.1...v2.15.50-alpha.2) (2021-03-28)


### Bug Fixes

* upload release with wildcard and remove checkout repo where not needed ([3d0b0be](https://github.com/unraid/api/commit/3d0b0bee8e344d5be33384708f51986eb89c4d35))

### [2.15.50-alpha.1](https://github.com/unraid/api/compare/v2.15.50-alpha.0...v2.15.50-alpha.1) (2021-03-28)


### Bug Fixes

* remove uses line ([9752f50](https://github.com/unraid/api/commit/9752f50fcf0d7d3a9552dd37ec2d3010137fc8b8))

### [2.15.50-alpha.0](https://github.com/unraid/api/compare/v2.15.49...v2.15.50-alpha.0) (2021-03-28)


### Bug Fixes

* add gating to actions ([dd1f583](https://github.com/unraid/api/commit/dd1f583fa1ba2b61dda970307d63c351f9abfc8f))
* remove unneeded if in workflow ([c266f04](https://github.com/unraid/api/commit/c266f04978b77a41b8c7831004cdc094f64a0b3f))
* require coverage before building app ([77330b4](https://github.com/unraid/api/commit/77330b43f0595b8eaf0a55200be1bc781f464435))

### [2.15.49](https://github.com/unraid/api/compare/v2.15.49-alpha.0...v2.15.49) (2021-03-28)


### Bug Fixes

* only release on v tag and save source tgz to artifacts ([09b180a](https://github.com/unraid/api/commit/09b180aee79384658e9aa3c3dade09d97a5d317a))
* upload source to github artifacts ([cfe55a5](https://github.com/unraid/api/commit/cfe55a5535a2b7d490559ce531eb40e6187ddadd))

### [2.15.49-alpha.0](https://github.com/unraid/api/compare/v2.15.48...v2.15.49-alpha.0) (2021-03-28)


### Bug Fixes

* run actions on tag ([e96a9d9](https://github.com/unraid/api/commit/e96a9d967fe6d44ea4d4912af1db54a334798d74))

### [2.15.48](https://github.com/unraid/api/compare/v2.15.47...v2.15.48) (2021-03-28)


### Bug Fixes

* ensure onConnect is executed in order ([81a2b1d](https://github.com/unraid/api/commit/81a2b1d82337680a7e159545949f3e69bae132da))
* include binary in tgz ([c4f9d05](https://github.com/unraid/api/commit/c4f9d057b620dd6b18565126e6bf4c51249d95c1))
* install nexe globally before building ([8b90970](https://github.com/unraid/api/commit/8b90970817caa3c616235bca710af6d97db2c2d2))
* remove build validation step ([266644c](https://github.com/unraid/api/commit/266644c2b5d78ba1e843fc7bf4a39a629af86893))

### [2.15.47](https://github.com/unraid/api/compare/v2.15.46...v2.15.47) (2021-03-26)


### Bug Fixes

* ensure we're passing in apiKey to getServers ([5b13474](https://github.com/unraid/api/commit/5b134746bbf0e1ed849a8ca22750039b6592c100))

### [2.15.46](https://github.com/unraid/api/compare/v2.15.45...v2.15.46) (2021-03-26)


### Bug Fixes

* query servers before subscribing ([a542df0](https://github.com/unraid/api/commit/a542df089fda70cc09b8d73e6123e173d1f823b4))

### [2.15.45](https://github.com/unraid/api/compare/v2.15.44-rolling-20210324233616...v2.15.45) (2021-03-24)

### [2.15.44](https://github.com/unraid/api/compare/v2.15.43-rolling-20210322232034...v2.15.44) (2021-03-22)

### [2.15.43](https://github.com/unraid/api/compare/v2.15.42...v2.15.43) (2021-03-19)


### Bug Fixes

* getting incorrect pid for process ([53f135a](https://github.com/unraid/api/commit/53f135a00e9530dc3fb9419e7bb452b0ec7ea666))

### [2.15.42](https://github.com/unraid/api/compare/v2.15.41-rolling-20210319063147...v2.15.42) (2021-03-19)


### Bug Fixes

* when relay drops reconnect internally ([97edc3a](https://github.com/unraid/api/commit/97edc3ae1f3395329b26ea0ead48699e8c5f284c))

### [2.15.41](https://github.com/unraid/api/compare/v2.15.40-rolling-20210312023151...v2.15.41) (2021-03-12)

### [2.15.40](https://github.com/unraid/api/compare/v2.15.39-rolling-20210311102904...v2.15.40) (2021-03-11)


### Bug Fixes

* reorder of loading api-manager and graphql ([d4dbbc1](https://github.com/unraid/api/commit/d4dbbc1c65e4a903a3e367740c5faf897808a107))

### [2.15.39](https://github.com/unraid/api/compare/v2.15.38...v2.15.39) (2021-03-08)


### Bug Fixes

* ensure cwd is always in the VFS when we daemonize ([5ccd55a](https://github.com/unraid/api/commit/5ccd55a04ba8a423cf81dd131c0ae6f750c16709))
* Make sure the process changes to the cwd ([0ce833b](https://github.com/unraid/api/commit/0ce833bf00f7d205babea849571be7a251d5aa76))
* use correct cwd ([391bd24](https://github.com/unraid/api/commit/391bd24502f83d4366d20d89d64a0e2b26fb610e))

### [2.15.38](https://github.com/unraid/api/compare/v2.15.37-rolling-20210307212325...v2.15.38) (2021-03-08)


### Bug Fixes

* move daemonization to process ([b7867f6](https://github.com/unraid/api/commit/b7867f66dcd86b90f85a20d308bf485fc797aa38))

### [2.15.37](https://github.com/unraid/api/compare/v2.15.36-rolling-20210306003234...v2.15.37) (2021-03-06)


### Bug Fixes

* revamp rc.unraid-api file ([1f720fc](https://github.com/unraid/api/commit/1f720fc87f1c077566a134c6bb2e82f094a944f8))

### [2.15.36](https://github.com/unraid/api/compare/v2.15.35-rolling-20210305063350...v2.15.36) (2021-03-05)


### Bug Fixes

* cli loading wrong path for index ([66b5f33](https://github.com/unraid/api/commit/66b5f3383d46ce3746f46be5414e8f5010120adb))
* cli using wrong path again ([8c24bcd](https://github.com/unraid/api/commit/8c24bcd4d6666b6a7253b0c0b099f3efae093997))
* remove old entry file ([8d0496a](https://github.com/unraid/api/commit/8d0496a17eaf28aff51d673d1a1d003ba64a49e1))
* throwing error when no processes were found ([70d006b](https://github.com/unraid/api/commit/70d006bb171b747e6b2119ced9d26a8194f89e19))

### [2.15.35](https://github.com/unraid/api/compare/v2.15.34-rolling-20210303041522...v2.15.35) (2021-03-05)


### Bug Fixes

* use binary instead of js file ([1bbe6e7](https://github.com/unraid/api/commit/1bbe6e78f9add5b82bcba55ba965ca9ea6f8d519))
* use utf8 not utf-8 ([e2aecd1](https://github.com/unraid/api/commit/e2aecd1191aed7a3bd513b3fed93281171bd0c4c))

### [2.15.34](https://github.com/unraid/api/compare/v2.15.33-rolling-20210301050144...v2.15.34) (2021-03-01)

### [2.15.33](https://github.com/unraid/api/compare/v2.15.32-rolling-20210225000914...v2.15.33) (2021-02-25)

### [2.15.32](https://github.com/unraid/api/compare/v2.15.31-rolling-20210223003452...v2.15.32) (2021-02-23)

### [2.15.31](https://github.com/unraid/api/compare/v2.15.30-rolling-20210215042604...v2.15.31) (2021-02-15)


### Bug Fixes

* add missing bundled deps ([d95890f](https://github.com/unraid/api/commit/d95890f8033f7ca83b0abb39fd73cb2c1f519de5))

### [2.15.30](https://github.com/unraid/api/compare/v2.15.29-rolling-20210212233055...v2.15.30) (2021-02-12)

### [2.15.29](https://github.com/unraid/api/compare/v2.15.27-rolling-20210212222549...v2.15.29) (2021-02-12)

### [2.15.28](https://github.com/unraid/api/compare/v2.15.27-rolling-20210212222549...v2.15.28) (2021-02-12)

### [2.15.27](https://github.com/unraid/api/compare/v2.15.26-rolling-20210212002135...v2.15.27) (2021-02-12)

### [2.15.26](https://github.com/unraid/api/compare/v2.15.25-rolling-20210202230645...v2.15.26) (2021-02-02)


### Bug Fixes

* array not returning data ([61dbf34](https://github.com/unraid/api/commit/61dbf342073c122125deb5c11e7057b715579928))
* hide excessive logs ([a7543d8](https://github.com/unraid/api/commit/a7543d8a1ad198bb8152f438fb09c67816c90928))

### [2.15.25](https://github.com/unraid/api/compare/v2.15.24-rolling-20210127012838...v2.15.25) (2021-01-27)

### [2.15.24](https://github.com/unraid/api/compare/v2.15.21-rolling-20210126002432...v2.15.24) (2021-01-26)

### [2.15.23](https://github.com/unraid/api/compare/v2.15.21-rolling-20210126002432...v2.15.23) (2021-01-26)

### [2.15.22](https://github.com/unraid/api/compare/v2.15.21-rolling-20210123003533...v2.15.22) (2021-01-26)

### [2.15.21](https://github.com/unraid/api/compare/v2.15.20-rolling-20210122032244...v2.15.21) (2021-01-22)


### Bug Fixes

* Cannot find module 'string-to-color' ([a2b4a98](https://github.com/unraid/api/commit/a2b4a98f932f3404e94789794d8f89901f94c623))

### [2.15.20](https://github.com/unraid/api/compare/v2.15.19...v2.15.20) (2020-12-17)

### [2.15.19](https://github.com/unraid/api/compare/v2.15.17-rolling-20201217015904...v2.15.19) (2020-12-17)

### [2.15.18](https://github.com/unraid/api/compare/v2.15.17-rolling-20201215230150...v2.15.18) (2020-12-16)

### [2.15.17](https://github.com/unraid/api/compare/v2.15.15-rolling-20201215201134...v2.15.17) (2020-12-15)

### [2.15.16](https://github.com/unraid/api/compare/v2.15.15-rolling-20201215201134...v2.15.16) (2020-12-15)

### [2.15.15](https://github.com/unraid/api/compare/v2.15.14-rolling-20201214210805...v2.15.15) (2020-12-15)


### Bug Fixes

* add too_many_missing_disks to ArrayState enum ([716fc00](https://github.com/unraid/api/commit/716fc0012b14265d80152809988087441c5dcbe3))

### [2.15.14](https://github.com/unraid/api/compare/v2.15.13...v2.15.14) (2020-12-11)

### [2.15.13](https://github.com/unraid/api/compare/v2.15.12-rolling-20201211192342...v2.15.13) (2020-12-11)

### [2.15.12](https://github.com/unraid/node-api/compare/v2.15.11-rolling-20201209125830...v2.15.12) (2020-12-09)

### [2.15.11](https://github.com/unraid/node-api/compare/v2.15.10...v2.15.11) (2020-12-04)


### Bug Fixes

* don't fail on empty socket file ([15fbec7](https://github.com/unraid/node-api/commit/15fbec795af0d1ded471381c07dda0e10ef10bfb))

### [2.15.10](https://github.com/unraid/node-api/compare/v2.15.9-rolling-20201204195706...v2.15.10) (2020-12-04)

### [2.15.9](https://github.com/unraid/node-api/compare/v2.15.8...v2.15.9) (2020-11-25)

### [2.15.8](https://github.com/unraid/node-api/compare/v2.15.7-rolling-20201125000755...v2.15.8) (2020-11-25)

### [2.15.7](https://github.com/unraid/node-api/compare/v2.15.6...v2.15.7) (2020-11-22)


### Bug Fixes

* only log non-fatal errors in debug mode ([a9d9871](https://github.com/unraid/node-api/commit/a9d987107b8501999985b681e17f6ae02147796c))

### [2.15.6](https://github.com/unraid/node-api/compare/v2.15.5...v2.15.6) (2020-11-22)

### [2.15.5](https://github.com/unraid/node-api/compare/v2.15.4-rolling-20201120023635...v2.15.5) (2020-11-22)

### [2.15.4](https://github.com/unraid/node-api/compare/v2.15.3-rolling-20201111222454...v2.15.4) (2020-11-11)

### [2.15.3](https://github.com/unraid/node-api/compare/v2.15.2-rolling-20201111005339...v2.15.3) (2020-11-11)

### [2.15.2](https://github.com/unraid/node-api/compare/v2.15.1...v2.15.2) (2020-11-10)

### [2.15.1](https://github.com/unraid/node-api/compare/v2.15.0-rolling-20201110215547...v2.15.1) (2020-11-10)

## [2.15.0](https://github.com/unraid/node-api/compare/v2.14.0...v2.15.0) (2020-10-26)

### [2.12.1-rolling-20201022224239](https://github.com/unraid/node-api/compare/v2.12.1-rolling-20201022223523...v2.12.1-rolling-20201022224239) (2020-10-22)


### Bug Fixes

* **plg:** bug on commit message arg parsing ([6c83673](https://github.com/unraid/node-api/commit/6c83673d20f8bcfa1ac20415fd75994efd42ab75))

### [2.12.1-rolling-20201022223523](https://github.com/unraid/node-api/compare/v2.12.1-rolling-20201021223739...v2.12.1-rolling-20201022223523) (2020-10-22)


### Bug Fixes

* **plg:** on sign out remove email dynamix.cfg ([3a697e7](https://github.com/unraid/node-api/commit/3a697e7bb6543a95b4eb8ca26d811ea80d592bb8))

### [2.12.1-rolling-20201021223739](https://github.com/unraid/node-api/compare/v2.12.1-rolling-20201021221003...v2.12.1-rolling-20201021223739) (2020-10-21)


### Bug Fixes

* rename graphql-api.sock to unraid-api.sock for old unraid versions ([d133f63](https://github.com/unraid/node-api/commit/d133f637c2cc8fdcd1e3c154f2ceec70d742d072))

### [2.12.1-rolling-20201021221003](https://github.com/unraid/node-api/compare/v2.12.1...v2.12.1-rolling-20201021221003) (2020-10-21)


### Features

* **plg:** add regWizTime to know if server ever signed in ([bb87317](https://github.com/unraid/node-api/commit/bb87317c98be2b5af4a849b7a5136f8c4d9d62cc))

## [2.14.0](https://github.com/unraid/node-api/compare/v2.12.1...v2.14.0) (2020-10-26)


### Features

* **rc:** remember env on reboot ([ff79e14](https://github.com/unraid/node-api/commit/ff79e14743d051d8bb1302f1493453cadf249703))

## [2.13.0](https://github.com/unraid/node-api/compare/v2.12.1...v2.13.0) (2020-10-26)


### Features

* **rc:** remember env on reboot ([ff79e14](https://github.com/unraid/node-api/commit/ff79e14743d051d8bb1302f1493453cadf249703))

### [2.12.1](https://github.com/unraid/node-api/compare/v2.12.0...v2.12.1) (2020-10-20)


### Bug Fixes

* graphql-api -> node-api ([f28f81b](https://github.com/unraid/node-api/commit/f28f81bf70f520b28c8c41879c801b4e33c87324))
* start-debug not removing correct socket and add report command ([99d4e81](https://github.com/unraid/node-api/commit/99d4e810b924f2d3f02c2e2da9170b0acf1b872c))

## [2.12.0](https://github.com/unraid/node-api/compare/v2.11.9...v2.12.0) (2020-10-20)

### [2.11.8-rolling-20201020182621](https://github.com/unraid/node-api/compare/v2.11.8-rolling-20201020090647...v2.11.8-rolling-20201020182621) (2020-10-20)


### Features

* async flash backup status ([655238c](https://github.com/unraid/node-api/commit/655238ccd925f23feecbe6c10c51550b01358aa2))

### [2.11.8-rolling-20201020090647](https://github.com/unraid/node-api/compare/v2.11.8-rolling-20201020061418...v2.11.8-rolling-20201020090647) (2020-10-20)


### Bug Fixes

* adjust wc copy options ([90f8d8e](https://github.com/unraid/node-api/commit/90f8d8eec66eedecedf56f2dd79c686c2bedff77))

### [2.11.9](https://github.com/unraid/node-api/compare/v2.11.8...v2.11.9) (2020-10-20)


### Bug Fixes

* copy wc files to correct location on install ([bfaa91c](https://github.com/unraid/node-api/commit/bfaa91c237a8532a0cd77ca9605c73b30f97966c))
* stop wasn't killing process ([b7c213b](https://github.com/unraid/node-api/commit/b7c213b949152ce0842ccedf0ba4997d061c5e1f))
* use correct port ([36e41dc](https://github.com/unraid/node-api/commit/36e41dc1e25e144037cc332ae72560298b20a7f4))

### [2.11.8](https://github.com/unraid/node-api/compare/v2.11.7...v2.11.8) (2020-10-20)

### [2.11.7](https://github.com/unraid/node-api/compare/v2.11.6...v2.11.7) (2020-10-20)


### Bug Fixes

* webcomponents not being installed correctly ([fef15e2](https://github.com/unraid/node-api/commit/fef15e28d19647c51dfb5980dd8d93236544fdc9))

### [2.11.6](https://github.com/unraid/node-api/compare/v2.11.5...v2.11.6) (2020-10-20)


### Bug Fixes

* prevent killing of pid 1 when running stop ([0c1151e](https://github.com/unraid/node-api/commit/0c1151e43fa50df832ca86c685b2353c9bdce1e2))

### [2.11.5](https://github.com/unraid/graphql-api/compare/v2.11.4...v2.11.5) (2020-10-20)

### [2.11.4](https://github.com/unraid/graphql-api/compare/v2.11.3...v2.11.4) (2020-10-20)


### Bug Fixes

* broken varstate ([e099488](https://github.com/unraid/graphql-api/commit/e099488c24fde1aab9d7ed1ad118f23cde4c361d))

### [2.11.3](https://github.com/unraid/graphql-api/compare/v2.11.2...v2.11.3) (2020-10-19)


### Bug Fixes

* update info subscription when hostname changes ([3500248](https://github.com/unraid/graphql-api/commit/35002488c332a52d839d40f1a345922e37776c13))

### [2.11.2](https://github.com/unraid/graphql-api/compare/v2.11.1-rolling-20201016042757...v2.11.2) (2020-10-19)


### Bug Fixes

* docker containers not updating info correctly ([e2aeeb9](https://github.com/unraid/graphql-api/commit/e2aeeb9aa946dc1c565d9c45d273c0ecbbb42305))

### [2.11.1](https://github.com/unraid/graphql-api/compare/v2.11.0...v2.11.1) (2020-10-15)


### Bug Fixes

* servers subscription not having data ([72cf071](https://github.com/unraid/graphql-api/commit/72cf07150bb4519769d0f8405fcce07e65e58eb8))
* wrong env printing after switching env ([a5efa77](https://github.com/unraid/graphql-api/commit/a5efa77933a1a2dca4c940dddd5158a6324d5e7e))

## [2.11.0](https://github.com/unraid/graphql-api/compare/v2.10.20-rolling-20201013192520...v2.11.0) (2020-10-15)


### Features

* add switch-env to plg rc.d file ([b77f1f5](https://github.com/unraid/graphql-api/commit/b77f1f5a784651080410e1ac0e728b6fe4d974d9))


### Bug Fixes

* ensure we send the correct environment field to Sentry ([0e67018](https://github.com/unraid/graphql-api/commit/0e67018abbac9b547881016031fd10081e878b20))

### [2.10.20](https://github.com/unraid/graphql-api/compare/v2.10.19...v2.10.20) (2020-10-08)

### [2.10.19](https://github.com/unraid/graphql-api/compare/v2.10.18...v2.10.19) (2020-10-08)


### Bug Fixes

* mount subscriptionEndpoint at /graphql ([5fe2f00](https://github.com/unraid/graphql-api/commit/5fe2f0080cbe2db83ba433cdc354ad5658f4a1d0))

### [2.10.18](https://github.com/unraid/graphql-api/compare/v2.10.17...v2.10.18) (2020-10-07)

### [2.10.16-rolling-20201007054315](https://github.com/unraid/graphql-api/compare/v2.10.16...v2.10.16-rolling-20201007054315) (2020-10-07)


### Bug Fixes

* postMessage ping backs to regwiz ([8d2c831](https://github.com/unraid/graphql-api/commit/8d2c83115fe52cc9bcc88d92a65212d0152ef9e4))
* **plg:** add postMessage listener PREFLIGHT_REQUEST ([ba35341](https://github.com/unraid/graphql-api/commit/ba353411150e69aa1fed2da6d6a59efb974f4c77))

### [2.10.17](https://github.com/unraid/graphql-api/compare/v2.10.16...v2.10.17) (2020-10-07)

### [2.10.16](https://github.com/unraid/graphql-api/compare/v2.10.15...v2.10.16) (2020-10-07)


### Bug Fixes

* switch to single /servers endpoint for mothership ([9a730ef](https://github.com/unraid/graphql-api/commit/9a730ef78875389deee805704042a1aa42bfc65c))

### [2.10.15](https://github.com/unraid/graphql-api/compare/v2.10.14...v2.10.15) (2020-10-05)


### Bug Fixes

* strip error: from array state to fix enum ([c01dda6](https://github.com/unraid/graphql-api/commit/c01dda69e5dab210fd664c1a9c7662bc30fd902e))

### [2.10.14](https://github.com/unraid/graphql-api/compare/v2.10.13...v2.10.14) (2020-10-05)

### [2.10.11-rolling-20201004083001](https://github.com/unraid/graphql-api/compare/v2.10.11...v2.10.11-rolling-20201004083001) (2020-10-04)


### Bug Fixes

* **plg:** rc.flash_backup refactor ([e580d3d](https://github.com/unraid/graphql-api/commit/e580d3dd980875bb65083ff39b21b6c74769f529))

### [2.10.13](https://github.com/unraid/graphql-api/compare/v2.10.12...v2.10.13) (2020-10-05)


### Bug Fixes

* sub to new servers and unsub from old ones on servers update ([3ba38d2](https://github.com/unraid/graphql-api/commit/3ba38d21840ff6bd3a51f4ea6b0eb8504318ef54))

### [2.10.12](https://github.com/unraid/graphql-api/compare/v2.10.11...v2.10.12) (2020-10-05)


### Bug Fixes

* allow graphql-api to boot without data disks ([592d089](https://github.com/unraid/graphql-api/commit/592d089cadfed59c92481d2aaeaad686088c6a35))

### [2.10.11](https://github.com/unraid/graphql-api/compare/v2.10.10...v2.10.11) (2020-10-04)

### [2.10.10](https://github.com/unraid/graphql-api/compare/v2.10.9...v2.10.10) (2020-10-04)


### Bug Fixes

* ensure mothership endpoints is an array ([c967571](https://github.com/unraid/graphql-api/commit/c9675717f56af7704720a026e154d4ed6ad856b8))

### [2.10.9](https://github.com/unraid/graphql-api/compare/v2.10.8...v2.10.9) (2020-10-04)


### Bug Fixes

* use staging server for mothership when connecting to /graphql ([0474bc1](https://github.com/unraid/graphql-api/commit/0474bc147cf7fb8729562f89d1d9c883a3041067))

### [2.10.8](https://github.com/unraid/graphql-api/compare/v2.10.7...v2.10.8) (2020-10-04)


### Bug Fixes

* not returning servers object ([d183225](https://github.com/unraid/graphql-api/commit/d183225ad3d9ac7a881e03718ce2c37515325c3c))
* pm2 path ([e728c6c](https://github.com/unraid/graphql-api/commit/e728c6ca2a72ed23a30a537ae0a795324d07a7f9))

### [2.10.7](https://github.com/unraid/graphql-api/compare/v2.10.6...v2.10.7) (2020-10-04)


### Bug Fixes

* include fetch import ([a7d7b2a](https://github.com/unraid/graphql-api/commit/a7d7b2aba9f7d4795f949cd0df0174c541510c5f))

### [2.10.6](https://github.com/unraid/graphql-api/compare/v2.10.5...v2.10.6) (2020-10-04)

### [2.10.5](https://github.com/unraid/graphql-api/compare/v2.10.4-rolling-20201003200559...v2.10.5) (2020-10-04)


### Bug Fixes

* add ultra runner to git ignore ([48784eb](https://github.com/unraid/graphql-api/commit/48784eb78a3afe1726833fc2f844da5f6b71b7b7))
* ensure we re-query the servers endpoint on update ([a9b4e85](https://github.com/unraid/graphql-api/commit/a9b4e8524d913638c698aaefb6fa7576cf9338f0))

### [2.10.4](https://github.com/unraid/graphql-api/compare/v2.10.3-rolling-20201003110346...v2.10.4) (2020-10-03)

### [2.10.3](https://github.com/unraid/graphql-api/compare/v2.10.2...v2.10.3) (2020-10-02)


### Bug Fixes

* enable subscription to mothership's servers endpoint ([f59feff](https://github.com/unraid/graphql-api/commit/f59feff346ea6b6cb114d9b7d485e3eeabcaacc5))

### [2.10.2](https://github.com/unraid/graphql-api/compare/v2.10.1...v2.10.2) (2020-10-02)

### [2.10.1](https://github.com/unraid/graphql-api/compare/v2.10.0...v2.10.1) (2020-10-02)


### Bug Fixes

* remove unneeded process handlers ([f5e8d7d](https://github.com/unraid/graphql-api/commit/f5e8d7d8af9249fcaaecd844aea20c34aa80a544))
* servers endpoint not updating when mothership updates ([d6bf695](https://github.com/unraid/graphql-api/commit/d6bf6951c657892493a75d462aa6c56178aeb8a2))

## [2.10.0](https://github.com/unraid/graphql-api/compare/v2.9.8...v2.10.0) (2020-09-30)

### [2.9.7-rolling-20200930001048](https://github.com/unraid/graphql-api/compare/v2.9.7-rolling-20200929031135...v2.9.7-rolling-20200930001048) (2020-09-30)


### Bug Fixes

* **plg:** add token prop to open launchpad wc ([678e6f3](https://github.com/unraid/graphql-api/commit/678e6f3e457b5a5bdb3daa3eb6d1bd6b78eb9ff1))
* **plg:launchpad:** include serverstate prop ([7e2adbf](https://github.com/unraid/graphql-api/commit/7e2adbf19f9ee6315153ae2cb7d357ccdd71a998))

### [2.9.7-rolling-20200929031135](https://github.com/unraid/graphql-api/compare/v2.9.7-rolling-20200929025840...v2.9.7-rolling-20200929031135) (2020-09-29)


### Features

* **plg:** add /usr/local/sbin/flash_backup script ([a4f513d](https://github.com/unraid/graphql-api/commit/a4f513db049002dd2f72639cf62f19ce8a07669f))

### [2.9.7-rolling-20200929025840](https://github.com/unraid/graphql-api/compare/v2.9.7...v2.9.7-rolling-20200929025840) (2020-09-29)


### Bug Fixes

* **plg:** add token prop to <unraid-launchpad> ([f0af006](https://github.com/unraid/graphql-api/commit/f0af006bcaf1869914c77fa46379008289c596b3))
* **plg:** improve conditional for rendering <unraid-launchpad> ([77718d2](https://github.com/unraid/graphql-api/commit/77718d2677c33341be6b94a3426a4ef24e6e692d))
* **plg:** self code reivew ([9acfe98](https://github.com/unraid/graphql-api/commit/9acfe98a5e5597f6131f569786cf4c0e0678cefc))

### [2.9.8](https://github.com/unraid/graphql-api/compare/v2.9.7...v2.9.8) (2020-09-30)


### Bug Fixes

* add missing enum value ([44969dd](https://github.com/unraid/graphql-api/commit/44969dd2a3561d09e13bd8a9a52f80b2c95794de))

### [2.9.7](https://github.com/unraid/graphql-api/compare/v2.9.6...v2.9.7) (2020-09-26)

### [2.9.6](https://github.com/unraid/graphql-api/compare/v2.9.5...v2.9.6) (2020-09-26)


### Bug Fixes

* ensure even multiple processes don't break stop ([27d749a](https://github.com/unraid/graphql-api/commit/27d749a3405935aa78b967d9b085299bcb751476))
* ensure rc file runs correctly ([fc638ab](https://github.com/unraid/graphql-api/commit/fc638ab629686477617bb61fd89b5c31a5a41280))

### [2.9.5](https://github.com/unraid/graphql-api/compare/v2.9.4...v2.9.5) (2020-09-25)


### Bug Fixes

* ensure we have the cwd set correctly and add start-debug ([5bd1d99](https://github.com/unraid/graphql-api/commit/5bd1d996dc148eb7e8c50ca8defb47ed9a3e8565))

### [2.9.4](https://github.com/unraid/graphql-api/compare/v2.9.3...v2.9.4) (2020-09-25)

### [2.9.3](https://github.com/unraid/graphql-api/compare/v2.9.2...v2.9.3) (2020-09-25)


### Bug Fixes

* **sentry:** ensure we flush error queue before exiting ([2608e08](https://github.com/unraid/graphql-api/commit/2608e08c9ef9997f216caa83f1abd6adacebb24b))

### [2.9.2](https://github.com/unraid/graphql-api/compare/v2.9.1...v2.9.2) (2020-09-25)


### Bug Fixes

* move sentry into correct file ([7164e58](https://github.com/unraid/graphql-api/commit/7164e5810df8db20c7808a032a44510e609b1e8c))

### [2.9.1](https://github.com/unraid/graphql-api/compare/v2.9.0...v2.9.1) (2020-09-25)


### Bug Fixes

* add sentry to bundle ([4e23ff8](https://github.com/unraid/graphql-api/commit/4e23ff877dc8cbc4c48e1260b3849824dcef581a))

## [2.9.0](https://github.com/unraid/graphql-api/compare/v2.8.12...v2.9.0) (2020-09-25)


### Features

* add Sentry ([b7bba74](https://github.com/unraid/graphql-api/commit/b7bba74e5c3e10e4e4864633542e493b7d597d44))

### [2.8.12](https://github.com/unraid/graphql-api/compare/v2.8.11...v2.8.12) (2020-09-24)


### Bug Fixes

* ensure script path is absolute ([3ba3e00](https://github.com/unraid/graphql-api/commit/3ba3e00907b466b2811feb44fc72c395892b7aa8))

### [2.8.11](https://github.com/unraid/graphql-api/compare/v2.8.10...v2.8.11) (2020-09-24)

### [2.8.10](https://github.com/unraid/graphql-api/compare/v2.8.9...v2.8.10) (2020-09-24)


### Bug Fixes

* ensure we safely close the ws connection ([f700de4](https://github.com/unraid/graphql-api/commit/f700de439a21f02a32b0da9c02ac960e53b4f068))
* remove double disconnect for relay connection ([e40b2b7](https://github.com/unraid/graphql-api/commit/e40b2b71a6102af37324fccd966992961ee9ab3b))
* replace worker threads with pm2 ([49db15b](https://github.com/unraid/graphql-api/commit/49db15b7daf4b1f84a93c7af8c64c50c797e7171))

### [2.8.9](https://github.com/unraid/graphql-api/compare/v2.8.8...v2.8.9) (2020-09-19)


### Bug Fixes

* **envs:** incorrect env being used ([49f4f38](https://github.com/unraid/graphql-api/commit/49f4f38324d80f755f389e87be841d8838a1693d))

### [2.8.8](https://github.com/unraid/graphql-api/compare/v2.8.7...v2.8.8) (2020-09-19)


### Bug Fixes

* servers endpoint now returns correct data ([5de9c7a](https://github.com/unraid/graphql-api/commit/5de9c7a645000b49cd1badfd64ab3b89410f108f))

### [2.8.7](https://github.com/unraid/graphql-api/compare/v2.8.6...v2.8.7) (2020-09-19)


### Bug Fixes

* include missing import ([7ffb5ee](https://github.com/unraid/graphql-api/commit/7ffb5ee195855fa3cf3b983af1470683e5a787b5))

### [2.8.6](https://github.com/unraid/graphql-api/compare/v2.8.5...v2.8.6) (2020-09-19)

### [2.8.5](https://github.com/unraid/graphql-api/compare/v2.8.4-rolling-20200918223059...v2.8.5) (2020-09-19)


### Bug Fixes

* mothership connection, unneeded logging and servers endpoint ([62eaf0f](https://github.com/unraid/graphql-api/commit/62eaf0feeee034e55688dea22f425fa68a665a29))

### [2.8.4](https://github.com/unraid/graphql-api/compare/v2.8.3...v2.8.4) (2020-09-18)

### [2.8.3](https://github.com/unraid/graphql-api/compare/v2.8.2-rolling-20200909002219...v2.8.3) (2020-09-17)


### Bug Fixes

* make clustering optional ([5b96a74](https://github.com/unraid/graphql-api/commit/5b96a740fa6854b4925942417da3b35912f0e3ad))

### [2.8.2](https://github.com/unraid/graphql-api/compare/v2.8.1-rolling-20200908223106...v2.8.2) (2020-09-09)

### [2.8.1](https://github.com/unraid/graphql-api/compare/v2.8.0-rolling-20200904003421...v2.8.1) (2020-09-04)

## [2.8.0](https://github.com/unraid/graphql-api/compare/v2.7.14...v2.8.0) (2020-08-05)


### Features

* **plg:** add settings to toggle display description ([dad2757](https://github.com/unraid/graphql-api/commit/dad275738cf67cf0ecd40d652932614e64a80925))
* **plg:** store avatar url and username in dynamix.cfg ([3bfff0e](https://github.com/unraid/graphql-api/commit/3bfff0e2fff77177f592108e3a54e179209ad5e6))
* unraid-regwiz-auth web component replace basic sign in/out buttons ([233b66f](https://github.com/unraid/graphql-api/commit/233b66ffb86e6c23b8ed56a63991e8506116b4ab))


### Bug Fixes

* **mothership:** cleanup reconnection events ([90209a4](https://github.com/unraid/graphql-api/commit/90209a4816981491ed163a359cecc3845848d3e3))
* **plg:** add 'internalip' alias for 'serverip' ([57f597f](https://github.com/unraid/graphql-api/commit/57f597f4f4fcc721e43b64c011e331704a29af9d))
* **plg:** clean up props ([aa8cfd5](https://github.com/unraid/graphql-api/commit/aa8cfd57ded1d46ad31b8c288a74827b833aa437))
* **plg:** display setting alignment issues ([71c0b09](https://github.com/unraid/graphql-api/commit/71c0b09c52d616e801745dba52933cd501cb402a))
* min js references for web components ([7f10277](https://github.com/unraid/graphql-api/commit/7f10277aa35b4852107abc54eb7c353879eda720))

### [2.7.14](https://github.com/unraid/graphql-api/compare/v2.7.13...v2.7.14) (2020-07-19)


### Bug Fixes

* Management Access Great Again ([d40e851](https://github.com/unraid/graphql-api/commit/d40e851ebc9c3932df2eaae1aa1eadeb090591c3))

### [2.7.13](https://github.com/unraid/graphql-api/compare/v2.7.12...v2.7.13) (2020-07-19)

### [2.7.12](https://github.com/unraid/graphql-api/compare/v2.7.11...v2.7.12) (2020-07-18)

### [2.7.11](https://github.com/unraid/graphql-api/compare/v2.7.10-rolling-20200717061845...v2.7.11) (2020-07-18)

### [2.7.10](https://github.com/unraid/graphql-api/compare/v2.7.9...v2.7.10) (2020-07-14)


### Bug Fixes

* **owner endpoint:** ensure payload is saved correctly for my_servers ([7aeb498](https://github.com/unraid/graphql-api/commit/7aeb498815686e73deb73f2df96ef043a02f1d0b))

### [2.7.9](https://github.com/unraid/graphql-api/compare/v2.7.8...v2.7.9) (2020-07-12)


### Bug Fixes

* **sigusr:** switch master -> worker from SIGUSR1 to SIGUSR2 ([ac01c33](https://github.com/unraid/graphql-api/commit/ac01c3321ba6f6bc31b5e5b07b53bd845bfbc6ae))
* plg: ensure postMessage handler has non-empty data ([5f6bdd8](https://github.com/unraid/graphql-api/commit/5f6bdd8776d7ac64fc9f984f28730031278ff023))

### [2.7.8](https://github.com/unraid/graphql-api/compare/v2.7.7...v2.7.8) (2020-07-02)


### Bug Fixes

* **plg:** ensure dynamix.cfg exists ([f8eb9c7](https://github.com/unraid/graphql-api/commit/f8eb9c77fb8fc38dff0aa98903532236d03491b1))

### [2.7.7](https://github.com/unraid/graphql-api/compare/v2.7.6...v2.7.7) (2020-07-01)

### [2.7.6](https://github.com/unraid/graphql-api/compare/v2.7.5...v2.7.6) (2020-07-01)

### [2.7.5](https://github.com/unraid/graphql-api/compare/v2.7.4...v2.7.5) (2020-06-24)


### Bug Fixes

* **plg:** missing comma in php ([35467fa](https://github.com/unraid/graphql-api/commit/35467fa2b526e4fa036fa5bed44cb2dc5f3099f3))

### [2.7.4](https://github.com/unraid/graphql-api/compare/v2.7.3...v2.7.4) (2020-06-24)

### [2.7.3](https://github.com/unraid/graphql-api/compare/v2.7.2...v2.7.3) (2020-06-24)


### Bug Fixes

* **plg:** update Amplify URL ([06d7c53](https://github.com/unraid/graphql-api/commit/06d7c53f9930826a13479db3cd3efe1d703dd198))

### [2.7.2](https://github.com/unraid/graphql-api/compare/v2.7.1...v2.7.2) (2020-06-23)


### Bug Fixes

* **plg:** move js scripts to end of body, remove some unneeded props ([8bb75c4](https://github.com/unraid/graphql-api/commit/8bb75c46a81fea5ca7d83e62a56d9010d8d61487))

### [2.7.1](https://github.com/unraid/graphql-api/compare/v2.7.0...v2.7.1) (2020-06-23)


### Bug Fixes

* **plg:** added id="wc_userprofile" to UPC ([91d554c](https://github.com/unraid/graphql-api/commit/91d554ce917b01711b8908e63abe9fd8411eb687))

## [2.7.0](https://github.com/unraid/graphql-api/compare/v2.6.2...v2.7.0) (2020-06-20)


### Features

* **plg:** add apikey prop ([e040de1](https://github.com/unraid/graphql-api/commit/e040de101342d228f4b820959d18ea41ca3e8271))

### [2.6.2](https://github.com/unraid/graphql-api/compare/v2.6.1...v2.6.2) (2020-06-19)

### [2.6.1](https://github.com/unraid/graphql-api/compare/v2.6.0...v2.6.1) (2020-06-18)


### Bug Fixes

* cleanup servers endpoint ([ce46c63](https://github.com/unraid/graphql-api/commit/ce46c63bd052d27a8884179b952af5724c597bcb))
* ensure we have local data for server endpoint fallback ([0fd14b7](https://github.com/unraid/graphql-api/commit/0fd14b701b4b8b6211d3d85a2a583b92d7d178fd))

## [2.6.0](https://github.com/unraid/graphql-api/compare/v2.5.2...v2.6.0) (2020-06-18)


### Features

* **plg:** added uptime and expiretime props to user profile component ([847c842](https://github.com/unraid/graphql-api/commit/847c84290f9a893b0e47ce5cf17cd69c66d68739))

### [2.5.2](https://github.com/unraid/graphql-api/compare/v2.5.1...v2.5.2) (2020-06-13)


### Bug Fixes

* **plg:** fix a few issues with the serverstate vars ([d4b2249](https://github.com/unraid/graphql-api/commit/d4b224908854a870f1f82176c96b61b4709e186a))

### [2.5.1](https://github.com/unraid/graphql-api/compare/v2.5.0...v2.5.1) (2020-06-13)


### Bug Fixes

* **plg:** make profile field data dynamic ([5b34b7e](https://github.com/unraid/graphql-api/commit/5b34b7e6b446893558cea64f2f17e7b45c7a00a8))

## [2.5.0](https://github.com/unraid/graphql-api/compare/v2.4.13...v2.5.0) (2020-06-12)


### Features

* **plg:** return registered state ([7dbf26e](https://github.com/unraid/graphql-api/commit/7dbf26e139b04bffa85b4850a251937a061193f8))

### [2.4.13](https://github.com/unraid/graphql-api/compare/v2.4.12...v2.4.13) (2020-06-12)


### Bug Fixes

* **plg:** use urls instead of inline for js files ([c21c51d](https://github.com/unraid/graphql-api/commit/c21c51d0f98cdc52ef67ec4172a1a84f9f807a7d))

### [2.4.12](https://github.com/unraid/graphql-api/compare/v2.4.11-rolling-20200612065307...v2.4.12) (2020-06-12)

### [2.4.11](https://github.com/unraid/graphql-api/compare/v2.4.10...v2.4.11) (2020-06-08)

### [2.4.10](https://github.com/unraid/graphql-api/compare/v2.4.9-rolling-20200608060819...v2.4.10) (2020-06-08)


### Bug Fixes

* ensure we only allow permitted access to servers endpoint ([03f3450](https://github.com/unraid/graphql-api/commit/03f3450db6094ec65bdf346c9a9f1f9846cfbf13))
* **bundled-deps:** add bundle-dependencies to prevent missing deps ([123f1b4](https://github.com/unraid/graphql-api/commit/123f1b45b9103a65e00d87d15dd56136b860d6e4))
* **graphql:** fix types ([59b5242](https://github.com/unraid/graphql-api/commit/59b5242d674d944afd5175e8d34189b1a5d7f49f))
* misc changes ([ff48805](https://github.com/unraid/graphql-api/commit/ff48805da11296f274ef463481864f43499a768e))

### [2.4.9](https://github.com/unraid/graphql-api/compare/v2.4.7-rolling-20200512070304...v2.4.9) (2020-05-12)

### [2.4.8](https://github.com/unraid/graphql-api/compare/v2.4.7...v2.4.8) (2020-05-12)

### [2.4.7](https://github.com/unraid/graphql-api/compare/v2.4.6...v2.4.7) (2020-05-11)

### [2.4.6](https://github.com/unraid/graphql-api/compare/v2.4.5...v2.4.6) (2020-05-11)


### Bug Fixes

* cleanup build ([c062476](https://github.com/unraid/graphql-api/commit/c0624767470d41b129d6c70c21acc235b98eef96))

### [2.4.5](https://github.com/unraid/graphql-api/compare/v2.4.4...v2.4.5) (2020-05-10)


### Bug Fixes

* use full hub token ([56abfc0](https://github.com/unraid/graphql-api/commit/56abfc0df8b2514556f52628d2c1d50ddc8afc37))

### [2.4.4](https://github.com/unraid/graphql-api/compare/v2.4.3...v2.4.4) (2020-05-10)

### [2.4.3](https://github.com/unraid/graphql-api/compare/v2.4.2...v2.4.3) (2020-05-10)


### Bug Fixes

* **type:** ensure keyFile and x-flash-guid aren't ever undefined ([ae8e019](https://github.com/unraid/graphql-api/commit/ae8e019f1bff4dd87f537e1a3d37fe16f3b7a577))

### [2.4.2](https://github.com/unraid/graphql-api/compare/v2.4.1...v2.4.2) (2020-05-10)


### Bug Fixes

* makes array updates work again ([a3cd68c](https://github.com/unraid/graphql-api/commit/a3cd68cbd7c2d38719da646a50b6db79219239ad))

### [2.4.1](https://github.com/unraid/graphql-api/compare/v2.4.0-rolling-20200502044927...v2.4.1) (2020-05-08)

## [2.4.0](https://github.com/unraid/graphql-api/compare/v2.3.3-rolling-20200425020507...v2.4.0) (2020-05-02)


### Features

* **mothership:** add message support ([70d14c7](https://github.com/unraid/graphql-api/commit/70d14c72efe06e15655b4ee132cfda750871e1c1))

### [2.3.3](https://github.com/unraid/graphql-api/compare/v2.3.2-rolling-20200416175601...v2.3.3) (2020-04-17)

### [2.3.2](https://github.com/unraid/graphql-api/compare/v2.3.1...v2.3.2) (2020-04-13)


### Bug Fixes

* added subscriptions back to wsServer and other misc changes ([70472ed](https://github.com/unraid/graphql-api/commit/70472ed20a71b5cdd21ef148a4ae9535b8aa3f55))

### [2.3.1](https://github.com/unraid/graphql-api/compare/v2.3.0...v2.3.1) (2020-04-11)

## [2.3.0](https://github.com/unraid/graphql-api/compare/v2.2.1...v2.3.0) (2020-04-11)


### Features

* add proxy support (part 1) ([5389db1](https://github.com/unraid/graphql-api/commit/5389db148b4ca10b6328c9451aee30cc9b2dadb8))


### Bug Fixes

* **plg:** add template vars ([ddac833](https://github.com/unraid/graphql-api/commit/ddac833f5f5f9f55a41f49cfe75c243bca93e339))
* add lan-ip and fix tsc not finishing ([f603e02](https://github.com/unraid/graphql-api/commit/f603e02b5353f769ff59a1d2e75095a6a7e461a8))
* **mothership:** add lanIp and remove x-powered-by ([4a09df5](https://github.com/unraid/graphql-api/commit/4a09df5575c88ec8aa3795a75421703e4c4d45cf))

### [2.2.1](https://github.com/unraid/graphql-api/compare/v2.2.0...v2.2.1) (2020-02-24)

## [2.2.0](https://github.com/unraid/graphql-api/compare/v2.1.29...v2.2.0) (2020-02-24)


### Features

* enable log debug toggling and cleanup exit code ([9590ebc](https://github.com/unraid/graphql-api/commit/9590ebc7c5a67901bd40fd56e3ae3033041005cb))


### Bug Fixes

* allow master process to kill worker ([26e0598](https://github.com/unraid/graphql-api/commit/26e05986d0d02bcb80611c443a8e74eb42f85a67))

### [2.1.29](https://github.com/unraid/graphql-api/compare/v2.1.28...v2.1.29) (2020-02-14)


### Bug Fixes

* misc changes ([e4df23c](https://github.com/unraid/graphql-api/commit/e4df23c76c38f9657d09e6b170362bba369df258))

### [2.1.28](https://github.com/unraid/graphql-api/compare/v2.1.27...v2.1.28) (2020-02-14)

### [2.1.27](https://github.com/unraid/graphql-api/compare/v2.1.26...v2.1.27) (2020-02-07)


### Bug Fixes

* add process.title ([3694d0b](https://github.com/unraid/graphql-api/commit/3694d0bb183b4b4b2eb310985fe44cbf0d7d42ae))

### [2.1.26](https://github.com/unraid/graphql-api/compare/v2.1.25...v2.1.26) (2020-02-03)


### Bug Fixes

* make sure master doesnt die when worker does ([19d6501](https://github.com/unraid/graphql-api/commit/19d650197679c4c943ca07db5ab52d5eca80c6fc))

### [2.1.25](https://github.com/unraid/graphql-api/compare/v2.1.24...v2.1.25) (2020-02-02)

### [2.1.24](https://github.com/unraid/graphql-api/compare/v2.1.23...v2.1.24) (2020-02-02)


### Bug Fixes

* set cwd to __dirname and add logs ([770c7f5](https://github.com/unraid/graphql-api/commit/770c7f5cd8f116de9b4547dcfa3be784587e3f53))

### [2.1.23](https://github.com/unraid/graphql-api/compare/v2.1.22...v2.1.23) (2020-02-02)

### [2.1.22](https://github.com/unraid/graphql-api/compare/v2.1.21...v2.1.22) (2020-02-02)


### Bug Fixes

* **schema/info/versions:** fix typo ([b8aed46](https://github.com/unraid/graphql-api/commit/b8aed4671c1ad053ec19e38968edec67df6e3505))
* **typescript:** remove src from the dist directory on build ([6317020](https://github.com/unraid/graphql-api/commit/63170201c46d3d4ea4697c14ebb7a6d8c0b42399))
* **websocket:** bail if the ws is unknown as they have no context ([9e4bd1a](https://github.com/unraid/graphql-api/commit/9e4bd1a54056e2cb73e412f5036550c355607ee3))

### [2.1.21](https://github.com/unraid/graphql-api/compare/v2.1.20...v2.1.21) (2020-01-27)

### [2.1.20](https://github.com/unraid/graphql-api/compare/v2.1.19...v2.1.20) (2020-01-26)


### Bug Fixes

* ensure we're using the websocketId for the subcriptions count check ([9e5207c](https://github.com/unraid/graphql-api/commit/9e5207c12d97026475f591bf04bf397d2793a23c))

### [2.1.19](https://github.com/unraid/graphql-api/compare/v2.1.18...v2.1.19) (2020-01-26)


### Bug Fixes

* switch to using autogen id for each websocket connection ([0a9f49f](https://github.com/unraid/graphql-api/commit/0a9f49fadb30b6cb26f830c4ce8a5582c1c2516e))

### [2.1.18](https://github.com/unraid/graphql-api/compare/v2.1.17...v2.1.18) (2020-01-26)

### [2.1.17](https://github.com/unraid/graphql-api/compare/v2.1.16...v2.1.17) (2020-01-26)


### Bug Fixes

* **pubsub:** ensure we only publish to a channel with subscribers ([df9954f](https://github.com/unraid/graphql-api/commit/df9954fa5b8a078466aa42e28900119580cad432))

### [2.1.16](https://github.com/unraid/graphql-api/compare/v2.1.15...v2.1.16) (2020-01-26)

### [2.1.15](https://github.com/unraid/graphql-api/compare/v2.1.14...v2.1.15) (2020-01-25)


### Bug Fixes

* **dep:** update dee to include dist file ([146dabd](https://github.com/unraid/graphql-api/commit/146dabdcccc8631fa3061754c155572636d2e7ec))

### [2.1.14](https://github.com/unraid/graphql-api/compare/v2.1.13...v2.1.14) (2020-01-25)


### Bug Fixes

* **docker-events:** replace docker-events listener with star namespace ([4163326](https://github.com/unraid/graphql-api/commit/416332606c526dc401b714d392fabd6d5f3a127e))

### [2.1.13](https://github.com/unraid/graphql-api/compare/v2.1.12...v2.1.13) (2020-01-25)


### Bug Fixes

* replace machineId module with util and fix graphql subscriptions ([158bf6c](https://github.com/unraid/graphql-api/commit/158bf6c864e3f0f6c379df4a9d9ce5fbd4e8db42))

### [2.1.12](https://github.com/unraid/graphql-api/compare/v2.1.11...v2.1.12) (2020-01-23)


### Bug Fixes

* add missing graphql files ([02f32f5](https://github.com/unraid/graphql-api/commit/02f32f5f1140d8057b72542ef8ec9ae02193790f))

### [2.1.11](https://github.com/unraid/graphql-api/compare/v2.1.10...v2.1.11) (2020-01-23)


### Bug Fixes

* change files to dist instead of app ([daf74f4](https://github.com/unraid/graphql-api/commit/daf74f44d1953513b120cd8f236d89f5acb22e8b))

### [2.1.10](https://github.com/unraid/graphql-api/compare/v2.1.9-rolling-20200123055243...v2.1.10) (2020-01-23)

### [2.1.9](https://github.com/unraid/graphql-api/compare/v2.1.8...v2.1.9) (2020-01-11)

### [2.1.8](https://github.com/unraid/graphql-api/compare/v2.1.7...v2.1.8) (2020-01-10)

### [2.1.7](https://github.com/unraid/graphql-api/compare/v2.1.6...v2.1.7) (2020-01-10)

### [2.1.6](https://github.com/unraid/graphql-api/compare/v2.1.5...v2.1.6) (2020-01-10)


### Bug Fixes

* **module:graphql/index:** replace user onConnect/onDisconnect logging ([5971fce](https://github.com/unraid/graphql-api/commit/5971fce4e7953609635cd018072c1b768a28a6a1))

### [2.1.5](https://github.com/unraid/graphql-api/compare/v2.1.4...v2.1.5) (2019-11-25)

### [2.1.4](https://github.com/unraid/graphql-api/compare/v2.1.3...v2.1.4) (2019-11-11)


### Bug Fixes

* **ecosystem:** disable extra logging in production ([fbb8989](https://github.com/unraid/graphql-api/commit/fbb8989378aa1d4d47956c6d8e80dad6b770288b))

### [2.1.3](https://github.com/unraid/graphql-api/compare/v2.1.2...v2.1.3) (2019-11-11)

### [2.1.2](https://github.com/unraid/graphql-api/compare/v2.1.1...v2.1.2) (2019-11-11)


### Bug Fixes

* **ecosystem:** remove node_args and cleanup formatting ([b3a284b](https://github.com/unraid/graphql-api/commit/b3a284bfcbab10384c69d9c2fb54ac6bfe92a29e))

### [2.1.1](https://github.com/unraid/graphql-api/compare/v2.1.0...v2.1.1) (2019-11-10)

## [2.1.0](https://github.com/unraid/graphql-api/compare/v2.0.23...v2.1.0) (2019-11-10)


### Features

* **module:app/server:** add x-machine-id to header ([8e29f5f](https://github.com/unraid/graphql-api/commit/8e29f5fc1f4384a3b1e8c06ea380c36a4329ad15))
* **schema:info/machine-id:** added machineId to info ([beaad40](https://github.com/unraid/graphql-api/commit/beaad40ac750d3c4d38e754b7a2084947294cd47))

### [2.0.23](https://github.com/unraid/graphql-api/compare/v2.0.22...v2.0.23) (2019-11-10)


### Bug Fixes

* **module:graphql/schema/resolvers:** only update when clients connect ([22ff4c1](https://github.com/unraid/graphql-api/commit/22ff4c14d138aa9d288dfb31ee6716c7f8efebc1))

### [2.0.22](https://github.com/unraid/graphql-api/compare/v2.0.21...v2.0.22) (2019-11-09)

### [2.0.21](https://github.com/unraid/graphql-api/compare/v2.0.20...v2.0.21) (2019-11-04)

### [2.0.20](https://github.com/unraid/graphql-api/compare/v2.0.19...v2.0.20) (2019-11-04)

### [2.0.19](https://github.com/unraid/graphql-api/compare/v2.0.18...v2.0.19) (2019-11-04)


### Bug Fixes

* **subscriptions-transport-ws:** patch duplicate subscriptions ([c0d9825](https://github.com/unraid/graphql-api/commit/c0d9825f5802653e25a1fd6fe1255d1724cc27e0))

### [2.0.18](https://github.com/unraid/graphql-api/compare/v2.0.17...v2.0.18) (2019-11-03)


### Bug Fixes

* **ecosystem:** increase allowed memory heap from 100 to 200 ([35dccce](https://github.com/unraid/graphql-api/commit/35dcccec32c0184b2af6788b61f9b64a485570d2))

### [2.0.17](https://github.com/unraid/graphql-api/compare/v2.0.16...v2.0.17) (2019-11-03)


### Bug Fixes

* **ecosystem:** increase allowed memory heap ([856da3e](https://github.com/unraid/graphql-api/commit/856da3eb4b0a150a964bc0a212e7f78b10c3154d))

### [2.0.16](https://github.com/unraid/graphql-api/compare/v2.0.15...v2.0.16) (2019-11-03)


### Bug Fixes

* **modules:graphql/schema/resolvers:** reduce disks memory usage ([6d9b40b](https://github.com/unraid/graphql-api/commit/6d9b40b010f5b6debd6948c87d6a2e5bbeaeb3b7))

### [2.0.15](https://github.com/unraid/graphql-api/compare/v2.0.14...v2.0.15) (2019-11-03)


### Bug Fixes

* **ecosystem:** replace string with array ([25c1901](https://github.com/unraid/graphql-api/commit/25c19018914f464f27a2498482f6c0428f3874fc))

### [2.0.14](https://github.com/unraid/graphql-api/compare/v2.0.13...v2.0.14) (2019-11-03)

### [2.0.13](https://github.com/unraid/graphql-api/compare/v2.0.12...v2.0.13) (2019-10-31)

### [2.0.12](https://github.com/unraid/graphql-api/compare/v2.0.11...v2.0.12) (2019-10-31)

### [2.0.11](https://github.com/unraid/graphql-api/compare/v2.0.10...v2.0.11) (2019-10-31)

### [2.0.10](https://github.com/unraid/graphql-api/compare/v2.0.9...v2.0.10) (2019-10-31)


### Bug Fixes

* **module:graphql/schema/resolvers:** fix memory leak ([fa60021](https://github.com/unraid/graphql-api/commit/fa6002112d9bf8327765a54d31a373cfae33d2f4))

### [2.0.9](https://github.com/unraid/graphql-api/compare/v2.0.8...v2.0.9) (2019-10-27)

### [2.0.8](https://github.com/unraid/graphql-api/compare/v2.0.7...v2.0.8) (2019-10-27)

### [2.0.7](https://github.com/unraid/graphql-api/compare/v2.0.6...v2.0.7) (2019-10-26)


### Bug Fixes

* **deps:** update @unraid/core as it adds the missing abort-controller ([5b21941](https://github.com/unraid/graphql-api/commit/5b21941ba51032c937279eb228b11466b4159b6d))

### [2.0.6](https://github.com/unraid/graphql-api/compare/v2.0.5...v2.0.6) (2019-10-26)

### [2.0.5](https://github.com/unraid/graphql-api/compare/v2.0.4...v2.0.5) (2019-10-25)


### Bug Fixes

* **module:app/server:** fix EADDRINUSE ([eb8603f](https://github.com/unraid/graphql-api/commit/eb8603f7765aef12d35b53b49f1a8ff75367b528))

### [2.0.4](https://github.com/unraid/graphql-api/compare/v2.0.3...v2.0.4) (2019-10-22)

### [2.0.3](https://github.com/unraid/graphql-api/compare/v2.0.2...v2.0.3) (2019-10-20)


### Bug Fixes

* **module:index:** log whole error in development ([f8f3a3e](https://github.com/unraid/graphql-api/commit/f8f3a3e62fdfef79144c3600f7767e2115308580))

### [2.0.2](https://github.com/unraid/graphql-api/compare/v2.0.1...v2.0.2) (2019-10-19)

### [2.0.1](https://github.com/unraid/graphql-api/compare/v2.0.0...v2.0.1) (2019-10-17)

## [2.0.0](https://github.com/unraid/graphql-api/compare/v1.2.2...v2.0.0) (2019-10-17)


### ⚠ BREAKING CHANGES

* **module:graphql/schema/resolvers:** Reduces CPU usage when on my_servers.

### Bug Fixes

* **module:graphql/schema/resolvers:** remove unneeded await ([8b1dd10](https://github.com/unraid/graphql-api/commit/8b1dd104462a3db5599419b7730848350197c492))

### [1.2.2](https://github.com/unraid/graphql-api/compare/v1.2.1...v1.2.2) (2019-10-17)

### [1.2.1](https://github.com/unraid/graphql-api/compare/v1.2.0...v1.2.1) (2019-10-17)

## [1.2.0](https://github.com/unraid/graphql-api/compare/v1.1.1...v1.2.0) (2019-10-14)


### Features

* **schema:info/memory:** add basic types ([4d91b8b](https://github.com/unraid/graphql-api/commit/4d91b8be62271af18b8c2c355e7dc158b0652408))
* add new baseboard type to info ([6ecef3b](https://github.com/unraid/graphql-api/commit/6ecef3b0335e6bcf88ada7ce8276f3a03334a1be))


### Bug Fixes

* **schema:disks/disk:** add value to DiskSmartStatus & DiskInterfaceType ([01c3be1](https://github.com/unraid/graphql-api/commit/01c3be11e6eb920a457c4bb0ac669236c6d35371))

### [1.1.1](https://github.com/unraid/graphql-api/compare/v1.1.0...v1.1.1) (2019-10-12)


### Bug Fixes

* remove unneeded "deepmerge" dep ([b6447d7](https://github.com/unraid/graphql-api/commit/b6447d73168918c44aff44c6e0dc5dc3c732db36))

## [1.1.0](https://github.com/unraid/graphql-api/compare/v1.0.18...v1.1.0) (2019-10-12)

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
