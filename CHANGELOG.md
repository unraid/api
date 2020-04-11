# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
