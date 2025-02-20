# Changelog

## 4.1.2 (2025-02-20)


### Features

* add validation step to ensure that variables are set ([e3e9b2b](https://github.com/unraid/api/commit/e3e9b2bf404cb6f3bcae83db0395be272e4b79e3))
* always start the API and run npm link from script path ([30133ac](https://github.com/unraid/api/commit/30133acb0514a480177f563d4aee364a8a3fab1b))
* **api:** rm 2fa & t2fa from myservers config type ([#996](https://github.com/unraid/api/issues/996)) ([89e791a](https://github.com/unraid/api/commit/89e791ad2e6f0395bee05e3f8bdcb2c8d72305dd))
* array iteration for restoring files ([036e97b](https://github.com/unraid/api/commit/036e97bb02e463872b3c2f4b5f1aa3b4bf525d1e))
* attempt to resolve performance issues with rm earlier in build … ([#1152](https://github.com/unraid/api/issues/1152)) ([2a1aa95](https://github.com/unraid/api/commit/2a1aa95bd62ebfe42b62b8e7105c7a92b00cfca9))
* attempt to start unraid-api with background task ([2a102fc](https://github.com/unraid/api/commit/2a102fc9944f3080af66a8ebadee35059bce2009))
* begin building plugin with node instead of bash ([#1120](https://github.com/unraid/api/issues/1120)) ([253b65a](https://github.com/unraid/api/commit/253b65a85ab9c5f53d53ef265b41aa132678f278))
* cleanup disclaimer and command to add users ([6be3af8](https://github.com/unraid/api/commit/6be3af8d7569d9c413dd9349df52e3fa4cb4f631))
* convert to pnpm monorepo ([#1137](https://github.com/unraid/api/issues/1137)) ([8d89f8b](https://github.com/unraid/api/commit/8d89f8b20d6f3983d4e85b33827a857aa862db37))
* copy only needed files for nodejs ([acf587a](https://github.com/unraid/api/commit/acf587aa53ca25a3beae86afc608fc9ed68919ef))
* do not move upgradepkg ([ea16419](https://github.com/unraid/api/commit/ea16419929e0233e2c1ce37e2f4b79e3e64ce619))
* dont pass entire server state for privacy ([54e3f17](https://github.com/unraid/api/commit/54e3f17bd9e541f50970c696bbe8b602ec38a748))
* download nodejs and install on legacy OS versions ([2a95e4b](https://github.com/unraid/api/commit/2a95e4beb2364510003f187459e28bb610583c41))
* error when nodejs download fails ([6a9b14c](https://github.com/unraid/api/commit/6a9b14c68170d6430328cbb793d750f3177bdb32))
* extract node to usr/local/ ([4c0b55b](https://github.com/unraid/api/commit/4c0b55b269f47a9d8f746344ae701e353d80509a))
* fix missing flash line ([6897aad](https://github.com/unraid/api/commit/6897aad67f5c8b38450aa81e612b8aa98a9328c7))
* fix pm2 setup and add link command ([de9500f](https://github.com/unraid/api/commit/de9500ffa6f3aa1842152e0ab26f54c8c5c6e5cb))
* move ssoenabled to a boolean flag rather than ids ([404a02b](https://github.com/unraid/api/commit/404a02b26bae6554d15e317f613ebc727c8f702f))
* move variable declarations to theme.ts ([3c82ee1](https://github.com/unraid/api/commit/3c82ee1e9acc197c9768a624cdef8c2e23c56d00))
* name package with PR number ([a642bf1](https://github.com/unraid/api/commit/a642bf15fd813dca522808765994414e4ed5a56c))
* nodejs issues with version 2 ([9c6e52c](https://github.com/unraid/api/commit/9c6e52c2fa46e7504bc3fa500770373d8c1d1690))
* **plugin:** rm Date & Time format settings from Notification Settings ([e2148f3](https://github.com/unraid/api/commit/e2148f3c2eaf77ad707eddb7989cc20ec8df70ab))
* remove nghttp3 and only bundle nodejs ([8d8df15](https://github.com/unraid/api/commit/8d8df1592e5af127a992d5634ee9d344055cdf2c))
* separate install process ([b90a516](https://github.com/unraid/api/commit/b90a51600c3f70615b117f157d41585e55ef49de))
* sso login boolean ([34190a6](https://github.com/unraid/api/commit/34190a6910679b65362a9cfa0837bca7775cfda0))
* track node version in slackware ([42b010e](https://github.com/unraid/api/commit/42b010e4a141f2a338d65f4f727bf1d15521a5c6))
* **ui:** webgui-compatible web component library ([#1075](https://github.com/unraid/api/issues/1075)) ([1c7b2e0](https://github.com/unraid/api/commit/1c7b2e091b0975438860a8e1fc3db5fd8d3fcf93))
* unraid single sign on with account app ([5183104](https://github.com/unraid/api/commit/5183104b322a328eea3e4b2f6d86fd9d4b1c76e3))
* update packageManager field for pnpm ([8d5db7a](https://github.com/unraid/api/commit/8d5db7a9bfdf528e2d58b20cc62434ea5929d24f))
* Update plugin/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php ([42c0d58](https://github.com/unraid/api/commit/42c0d58da4d0570b7d865a8774964c18120ed585))
* upload files directly to cloudflare ([1982fc2](https://github.com/unraid/api/commit/1982fc238fefa1c67323bdc11ec1fb9c9f43c387))
* use plugin file for install and uninstall ([c9ac3a5](https://github.com/unraid/api/commit/c9ac3a5a0a3103fbd9c33a5d909fa475614a704a))
* validate entries correctly ([b101a69](https://github.com/unraid/api/commit/b101a695e18d71ddd170462b3d49289352166489))
* **web:** activation modal steps, updated copy ([#1079](https://github.com/unraid/api/issues/1079)) ([8af9d8c](https://github.com/unraid/api/commit/8af9d8c58895010e3ddc03cc5fa075ac1e264f50))
* **web:** rm old notification bell upon plugin installation ([#979](https://github.com/unraid/api/issues/979)) ([e09c07c](https://github.com/unraid/api/commit/e09c07c5070d59ac032baeff1ed253b5c00f4163))


### Bug Fixes

* add another missing symlink ([4e7f3ff](https://github.com/unraid/api/commit/4e7f3ff4d9aa0e4af417a50e2b30537dda3c759c))
* add error check to nodejs ([c8e0fe8](https://github.com/unraid/api/commit/c8e0fe87a34d7f066b7d0900dda205a40616bfb6))
* attempt to restore upgradepkg if install failed ([19c2a79](https://github.com/unraid/api/commit/19c2a79ce6c31c989f3d7f70cf7d8e2c219517b2))
* capitalize name ([31166b3](https://github.com/unraid/api/commit/31166b3483dc01847ad555618c43f8248411bdfa))
* cleanup commands ([052aea0](https://github.com/unraid/api/commit/052aea06a0d30963532f29f9961fce0ffc7fa3e8))
* delete unused line ([de4882e](https://github.com/unraid/api/commit/de4882ea17f54e788049cc5bb96b99b16822b6b4))
* delete upgradepkg ([74f0177](https://github.com/unraid/api/commit/74f0177ba0fd57722caa3ec14318d35167d3c6f7))
* dnserr on new line ([a3398a2](https://github.com/unraid/api/commit/a3398a29e15269be006e887fba6366c81b1d00f5))
* empty manifest and version alignment ([c4c44d9](https://github.com/unraid/api/commit/c4c44d92caa593795b9cb111a27828ecb8f62dbd))
* formatting issue ([42ca969](https://github.com/unraid/api/commit/42ca9691f7547a4340501863c1882efc0aee4c60))
* further resolve sso sub ids issues ([ef3d0ea](https://github.com/unraid/api/commit/ef3d0ead687d4a6071da290c0df29c12163303e1))
* install syntax error ([ec83480](https://github.com/unraid/api/commit/ec83480eb6aea09b98b9135516dc1fc8cdd6c692))
* more verbose logging for node install to find issues ([445af0c](https://github.com/unraid/api/commit/445af0c147ef641dac05ebeb2d44e63e8a4df799))
* node_txz naming ([b7c24ca](https://github.com/unraid/api/commit/b7c24ca861e92bf01118a17bc7e2322063e6a800))
* pass ssoSubIds only ([5adf13e](https://github.com/unraid/api/commit/5adf13ee070bdcd849339460b9888e51d224e765))
* PHP Warning in state.php ([#1126](https://github.com/unraid/api/issues/1126)) ([c154b4e](https://github.com/unraid/api/commit/c154b4e0ad2d0627b1541a7f9ee5e55235d4dd5e))
* pkg_build ([d4bff0e](https://github.com/unraid/api/commit/d4bff0ee96e6e0974978465573e72e68d09fd829))
* proper file replacements ([e0042f3](https://github.com/unraid/api/commit/e0042f353b47cfa72a485d6a58ad0b956ea6dbc2))
* restore upgradepkg before install ([fddca27](https://github.com/unraid/api/commit/fddca2738c0ec016e744169d88b35a55dea092fa))
* strip components from tar line ([911cd5b](https://github.com/unraid/api/commit/911cd5bc0b0983df4ca8c9057bea5166f7d1c7f1))
* upgradepkg ([90cf1a8](https://github.com/unraid/api/commit/90cf1a8eea67d3dbc736ecdfba47e0025b1dc31c))
* used TGZ instead of TXZ for nghttp3 ([09ad394](https://github.com/unraid/api/commit/09ad39483fed7a8155176b6568114b4e6679d587))
* variables passed properly ([e0875e7](https://github.com/unraid/api/commit/e0875e7a1b273969939d6902a55f4a9772640078))


### Miscellaneous Chores

* release 4.1.2 ([dbab290](https://github.com/unraid/api/commit/dbab290b429f9eff8fa903d193de2bd02bb392bd))
