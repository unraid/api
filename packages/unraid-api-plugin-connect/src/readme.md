# Connect implementation

See [the package guide](../readme.md) for settings, the overview contract, runtime
configuration, installation patches, and local verification commands.

`tunnel/` contains the host integration: explicit settings requests, contract data
mapping, file writes, and child-process lifetime. `remote-access/` retains manual
forwarding and UPnP; `network/upnp.service.ts` renews router leases. Transport and certificate logic
remain in the vendored Go executable.
