#!/bin/sh

# This runs both during package removal and installation
# $1 will be "remove" during package removal
# $1 will be "install" during package installation

if [ "$1" = "remove" ]; then
  # Clean up node_modules before package removal
  rm -rf /usr/local/unraid-api/node_modules
fi
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf apollo-pbjs )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../@apollo/protobufjs/bin/pbjs apollo-pbjs )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf apollo-pbts )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../@apollo/protobufjs/bin/pbts apollo-pbts )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf blessed )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../blessed/bin/tput.js blessed )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf esbuild )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../esbuild/bin/esbuild esbuild )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf escodegen )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../escodegen/bin/escodegen.js escodegen )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf esgenerate )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../escodegen/bin/esgenerate.js esgenerate )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf esparse )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../esprima/bin/esparse.js esparse )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf esvalidate )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../esprima/bin/esvalidate.js esvalidate )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf fxparser )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../fast-xml-parser/src/cli/cli.js fxparser )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf glob )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../glob/dist/esm/bin.mjs glob )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf js-yaml )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../js-yaml/bin/js-yaml.js js-yaml )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf jsesc )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../jsesc/bin/jsesc jsesc )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf loose-envify )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../loose-envify/cli.js loose-envify )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf mime )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../mime/cli.js mime )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf mkdirp )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../mkdirp/bin/cmd.js mkdirp )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf mustache )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../mustache/bin/mustache mustache )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf needle )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../needle/bin/needle needle )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf node-which )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../which/bin/node-which node-which )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf opencollective )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../@nuxtjs/opencollective/bin/opencollective.js opencollective )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf parser )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../@babel/parser/bin/babel-parser.js parser )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf pino )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../pino/bin.js pino )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf pino-pretty )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../pino-pretty/bin.js pino-pretty )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf pm2 )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../pm2/bin/pm2 pm2 )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf pm2-dev )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../pm2/bin/pm2-dev pm2-dev )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf pm2-docker )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../pm2/bin/pm2-docker pm2-docker )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf pm2-runtime )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../pm2/bin/pm2-runtime pm2-runtime )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf prettier )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../prettier/bin/prettier.cjs prettier )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf relay-compiler )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../@ardatan/relay-compiler/bin/relay-compiler relay-compiler )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf resolve )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../resolve/bin/resolve resolve )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf semver )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../semver/bin/semver.js semver )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf sha.js )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../sha.js/bin.js sha.js )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf sshpk-conv )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../sshpk/bin/sshpk-conv sshpk-conv )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf sshpk-sign )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../sshpk/bin/sshpk-sign sshpk-sign )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf sshpk-verify )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../sshpk/bin/sshpk-verify sshpk-verify )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf systeminformation )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../systeminformation/lib/cli.js systeminformation )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf tsc )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../typescript/bin/tsc tsc )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf tsserver )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../typescript/bin/tsserver tsserver )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf tsx )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../tsx/dist/cli.mjs tsx )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf ua-parser-js )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../ua-parser-js/script/cli.js ua-parser-js )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf uuid )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../uuid/dist/esm/bin/uuid uuid )
( cd usr/local/unraid-api/node_modules/.bin ; rm -rf xss )
( cd usr/local/unraid-api/node_modules/.bin ; ln -sf ../xss/bin/xss xss )
( cd usr/local/unraid-api/node_modules/@apollo/protobufjs/node_modules/.bin ; rm -rf apollo-pbjs )
( cd usr/local/unraid-api/node_modules/@apollo/protobufjs/node_modules/.bin ; ln -sf ../../bin/pbjs apollo-pbjs )
( cd usr/local/unraid-api/node_modules/@apollo/protobufjs/node_modules/.bin ; rm -rf apollo-pbts )
( cd usr/local/unraid-api/node_modules/@apollo/protobufjs/node_modules/.bin ; ln -sf ../../bin/pbts apollo-pbts )
( cd usr/local/unraid-api/node_modules/@apollo/server/node_modules/.bin ; rm -rf uuid )
( cd usr/local/unraid-api/node_modules/@apollo/server/node_modules/.bin ; ln -sf ../uuid/dist/bin/uuid uuid )
( cd usr/local/unraid-api/node_modules/@nestjs/core/node_modules/.bin ; rm -rf opencollective )
( cd usr/local/unraid-api/node_modules/@nestjs/core/node_modules/.bin ; ln -sf ../../../../@nuxtjs/opencollective/bin/opencollective.js opencollective )
( cd usr/local/unraid-api/node_modules/@nestjs/graphql/node_modules/.bin ; rm -rf uuid )
( cd usr/local/unraid-api/node_modules/@nestjs/graphql/node_modules/.bin ; ln -sf ../uuid/dist/esm/bin/uuid uuid )
( cd usr/local/unraid-api/node_modules/@nestjs/schedule/node_modules/.bin ; rm -rf uuid )
( cd usr/local/unraid-api/node_modules/@nestjs/schedule/node_modules/.bin ; ln -sf ../uuid/dist/esm/bin/uuid uuid )
( cd usr/local/unraid-api/node_modules/@pm2/agent/node_modules/.bin ; rm -rf semver )
( cd usr/local/unraid-api/node_modules/@pm2/agent/node_modules/.bin ; ln -sf ../semver/bin/semver.js semver )
( cd usr/local/unraid-api/node_modules/@pm2/io/node_modules/.bin ; rm -rf semver )
( cd usr/local/unraid-api/node_modules/@pm2/io/node_modules/.bin ; ln -sf ../semver/bin/semver.js semver )
( cd usr/local/unraid-api/node_modules/esbuild/node_modules/.bin ; rm -rf esbuild )
( cd usr/local/unraid-api/node_modules/esbuild/node_modules/.bin ; ln -sf ../../bin/esbuild esbuild )
( cd usr/local/unraid-api/node_modules/request/node_modules/.bin ; rm -rf uuid )
( cd usr/local/unraid-api/node_modules/request/node_modules/.bin ; ln -sf ../uuid/bin/uuid uuid )
