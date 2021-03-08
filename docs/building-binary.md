# @unraid/api

Unraid API

## Building the binary

To create a build using `nexe` run these commands on a completely **UP TO DATE** **UNRAID** machine.  


<details>
  <summary>Setup build environment</summary>

```bash
# Install node deps
npm i -g nexe del-cli move-file-cli
# Setup our directory
mkdir /sandbox && cd /sandbox
# Copy our source package
cp /boot/config/plugins/Unraid.net/unraid-api.tgz .
# Decompress the source
tar xvzf ./unraid-api.tgz
# Rename the directory and enter it
mv package/ unraid-api && cd unraid-api
# Run nexe to build the binary
npm run build-binary -s
# Go back to the parent directory
cd ..
```

At this point we should have this.
```bash
root@Devon:/sandbox/unraid-api# ls -lah
total 84M
drwxrwxrwx 2 root root  160 Mar  5 15:41 ./
drwxrwxrwx 3 root root   80 Mar  5 15:39 ../
-rw-r--r-- 1 root root  203 Oct 26  1985 .env.production
-rw-r--r-- 1 root root  303 Oct 26  1985 .env.staging
-rw-r--r-- 1 root root  43K Oct 26  1985 CHANGELOG.md
-rw-r--r-- 1 root root 2.6K Oct 26  1985 README.md
-rw-r--r-- 1 root root 7.1K Oct 26  1985 package.json
-rwxrwxrwx 1 root root  84M Mar  5 15:39 unraid-api*
```

</details>

<details>
  <summary>Building the new tgz</summary>


```bash
# Rename so the install thinks this is a normal npm tgz
mv unraid-api package
# Package the new binary and associated files
tar zcvf unraid-api-v$(grep '"version"' ./package/package.json | cut -d '"' -f 4)-nexe.tgz package
```

We should end up with this.
```bash
root@Devon:/sandbox# ls -lah
total 43M
drwxrwxrwx  3 root root 100 Mar  5 15:44 ./
drwxr-xr-x 20 xo   1000 420 Mar  5 15:37 ../
drwxrwxrwx  2 root root 160 Mar  5 15:41 package/
-rw-rw-rw-  1 root root 30M Mar  5 15:42 unraid-api-v2.15.34-nexe.tgz
-rw-------  1 root root 14M Mar  5 15:37 unraid-api.tgz
```

</details>