export const BASE_POLICY = `
# Admin permissions
p, admin, *, *, *

# UPC permissions for API keys
p, upc, apikey, read, any
p, upc, apikey, list, any
p, upc, apikey, create, any
p, upc, apikey, update, any
p, upc, permission, create, any

# UPC permissions
p, upc, cloud, read, own
p, upc, config, read, any
p, upc, crash-reporting-enabled, read, any
p, upc, customizations, read, any
p, upc, disk, read, any
p, upc, display, read, any
p, upc, flash, read, any
p, upc, info, read, any
p, upc, logs, read, any
p, upc, os, read, any
p, upc, owner, read, any
p, upc, registration, read, any
p, upc, servers, read, any
p, upc, vars, read, any
p, upc, config, update, own
p, upc, connect, read, own
p, upc, connect, update, own
p, upc, notifications, read, any
p, upc, notifications, update, any

# My Servers permissions
p, my_servers, array, read, any
p, my_servers, config, read, any
p, my_servers, connect, read, any
p, my_servers, connect/dynamic-remote-access, read, any
p, my_servers, connect/dynamic-remote-access, update, own
p, my_servers, customizations, read, any
p, my_servers, dashboard, read, any
p, my_servers, display, read, any
p, my_servers, docker/container, read, any
p, my_servers, docker, read, any
p, my_servers, info, read, any
p, my_servers, logs, read, any
p, my_servers, network, read, any
p, my_servers, notifications, read, any
p, my_servers, services, read, any
p, my_servers, vars, read, any
p, my_servers, vms, read, any
p, my_servers, vms/domain, read, any
p, my_servers, unraid-version, read, any

# Notifier permissions
p, notifier, notifications, create, own

# Guest permissions
p, guest, me, read, any
p, guest, welcome, read, any

# Role inheritance
g, admin, guest
g, upc, guest
g, my_servers, guest
g, notifier, guest
`;
