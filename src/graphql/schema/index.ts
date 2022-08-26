/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import { mergeTypeDefs } from '@graphql-tools/merge';

const filesPaths = [
	join(__dirname, '../src/graphql/schema/types/apikeys/apikey.graphql'),
	join(__dirname, '../src/graphql/schema/types/array/array.graphql'),
	join(__dirname, '../src/graphql/schema/types/array/parity.graphql'),
	join(__dirname, '../src/graphql/schema/types/cloud/cloud.graphql'),
	join(__dirname, '../src/graphql/schema/types/config/config.graphql'),
	join(__dirname, '../src/graphql/schema/types/crash-reporting-enabled/crash-reporting-enabled.graphql'),
	join(__dirname, '../src/graphql/schema/types/dashboard/dashboard.graphql'),
	join(__dirname, '../src/graphql/schema/types/devices/device.graphql'),
	join(__dirname, '../src/graphql/schema/types/disks/disk.graphql'),
	join(__dirname, '../src/graphql/schema/types/display/icons.graphql'),
	join(__dirname, '../src/graphql/schema/types/docker/container.graphql'),
	join(__dirname, '../src/graphql/schema/types/docker/network.graphql'),
	join(__dirname, '../src/graphql/schema/types/flash/flash.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/apps.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/baseboard.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/cpu.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/devices.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/display.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/machine-id.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/memory.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/os.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/system.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/versions.graphql'),
	join(__dirname, '../src/graphql/schema/types/info/vms.graphql'),
	join(__dirname, '../src/graphql/schema/types/notifications/notifications.graphql'),
	join(__dirname, '../src/graphql/schema/types/owner/owner.graphql'),
	join(__dirname, '../src/graphql/schema/types/registration/registration.graphql'),
	join(__dirname, '../src/graphql/schema/types/scopes/scope.graphql'),
	join(__dirname, '../src/graphql/schema/types/servers/server.graphql'),
	join(__dirname, '../src/graphql/schema/types/services/service.graphql'),
	join(__dirname, '../src/graphql/schema/types/shares/share.graphql'),
	join(__dirname, '../src/graphql/schema/types/two-factor/two-factor.graphql'),
	join(__dirname, '../src/graphql/schema/types/unassigned-devices/mount.graphql'),
	join(__dirname, '../src/graphql/schema/types/unassigned-devices/partition.graphql'),
	join(__dirname, '../src/graphql/schema/types/unassigned-devices/unassigned-device.graphql'),
	join(__dirname, '../src/graphql/schema/types/users/me.graphql'),
	join(__dirname, '../src/graphql/schema/types/users/user.graphql'),
	join(__dirname, '../src/graphql/schema/types/vars/vars.graphql'),
	join(__dirname, '../src/graphql/schema/types/vms/domain.graphql'),
	join(__dirname, '../src/graphql/schema/types/vms/network.graphql'),
];

const files = filesPaths.map(file => readFileSync(file, 'utf8'));

export const typeDefs = mergeTypeDefs(files);
