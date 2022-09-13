
# Hidden Flags

Use the following flags for additional functionality
1. Setting showT2Fa to "yes" will give you early access to unreleased features, specifically T2FA and the ability to specify extra origins.
```
[local]
showT2Fa="yes"
```
2. The deleteOnUninstall setting is for internal developers who are switching between the staging and production plugins, or otherwise installing/uninstalling the plugin a lot. Setting this to "no" prevents the uninstall routine from deleting your local flash backup files and disabling Remote Access. The assumption is that you will be reinstalling the plugin and don't want to lose those settings.
```
[plugin]
deleteOnUninstall="no"
```

# Plugin Hosted Urls

- Main: https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.plg
- Staging: https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.staging.plg
