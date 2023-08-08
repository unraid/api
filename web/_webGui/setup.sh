#!/bin/bash
cd /usr/local/emhttp/plugins/dynamix.my.servers/ || exit
# replace Connect.page
# replace includes/myservers{1|2}.php
mkdir webComponents
mkdir webComponents/_nuxt
cd webComponents || exit
touch manifest.json
# create _nuxt/{filename}.js
