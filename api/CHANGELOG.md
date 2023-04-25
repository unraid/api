# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
