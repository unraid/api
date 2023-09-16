import type { OsReleasesResponse } from '~/store/callback';

const testOsReleasesResponse: OsReleasesResponse = {
  "next": [
    {
      "version": "7.0.0-beta2",
      "name": "Unraid Server 7.0.0-beta2",
      "basefile": "unRAIDServer-7.0.0-beta2-x86_64.zip",
      "date": "2023-06-15",
      "url": "https://dl.next.unraid.net/unRAIDServer-7.0.0-beta2-x86_64.zip",
      "changelog": "",
      "md5": "FAKEbddcf415f2d0518804e551c1beXXX",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.next.unraid.net/unRAIDServer-7.0.0-beta2.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "7.0.0-beta1",
      "name": "Unraid Server 7.0.0-beta1",
      "basefile": "unRAIDServer-7.0.0-beta1-x86_64.zip",
      "date": "2023-06-15",
      "url": "https://dl.next.unraid.net/unRAIDServer-7.0.0-beta1-x86_64.zip",
      "changelog": "",
      "md5": "FAKEbddcf415f2d0518804e551c1beYYY",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.next.unraid.net/unRAIDServer-7.0.0-beta1.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.12.2-rc2",
      "name": "Unraid Server 6.12.2-rc2",
      "basefile": "unRAIDServer-6.12.2-rc2-x86_64.zip",
      "date": "2023-06-15",
      "url": "https://dl.next.unraid.net/unRAIDServer-6.12.2-rc2-x86_64.zip",
      "changelog": "",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.next.unraid.net/unRAIDServer-6.12.2-rc2.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    }
  ],
  "stable": [
    {
      "version": "6.12.5",
      "name": "Unraid Server 6.12.5",
      "basefile": "unRAIDServer-6.12.5-x86_64.zip",
      "date": "2023-08-31",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.12.5-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.12.5-release-notes",
      "md5": "FAKEbddcf415f2d0518804e551c16125",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.12.5.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.12.4",
      "name": "Unraid Server 6.12.4",
      "basefile": "unRAIDServer-6.12.4-x86_64.zip",
      "date": "2023-08-31",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.12.4-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.12.4-release-notes",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.12.4.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.12.3",
      "name": "Unraid Server 6.12.3",
      "basefile": "unRAIDServer-6.12.3-x86_64.zip",
      "date": "2023-07-31",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.12.3-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.12.3-release-notes",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.12.3.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.12.2",
      "name": "Unraid Server 6.12.2",
      "basefile": "unRAIDServer-6.12.2-x86_64.zip",
      "date": "2023-06-30",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.12.2-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.12.2-release-notes",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.12.2.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.12.1",
      "name": "Unraid Server 6.12.1",
      "basefile": "unRAIDServer-6.12.1-x86_64.zip",
      "date": "2023-06-08",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.12.1-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.12.1-release-notes",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.12.1.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.10.1",
      "name": "Unraid Server 6.10.1",
      "basefile": "unRAIDServer-6.10.1-x86_64.zip",
      "date": "2020-04-15",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.10.1-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.10.1-release-notes",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.10.1.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    },
    {
      "version": "6.9.0",
      "name": "Unraid Server 6.9.0",
      "basefile": "unRAIDServer-6.9.0-x86_64.zip",
      "date": "2019-10-31",
      "url": "https://dl.stable.unraid.net/unRAIDServer-6.9.0-x86_64.zip",
      "changelog": "https://unraid.net/blog/unraid-os-6.9.0-release-notes",
      "md5": "9050bddcf415f2d0518804e551c1be98",
      "size": 12345122,
      "sha256": "fda177bb1336270b24e4df0fd0c1dd0596c44699204f57c83ce70a0f19173be4",
      "plugin_url": "https://dl.stable.unraid.net/unRAIDServer-6.9.0.plg",
      "plugin_sha256": "83850536ed6982bd582ed107d977d59e9b9b786363e698b14d1daf52e2dec2d9"
    }
  ]
};

export default testOsReleasesResponse;