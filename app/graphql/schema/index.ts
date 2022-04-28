/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { readFileSync } from 'fs';
import { mergeTypeDefs } from '@graphql-tools/merge';

const files = [
	'./dist/types/graphql/schema/types/apikeys/apikey.graphql',
	'./dist/types/graphql/schema/types/array/array.graphql',
	'./dist/types/graphql/schema/types/array/parity.graphql',
	'./dist/types/graphql/schema/types/cloud/cloud.graphql',
	'./dist/types/graphql/schema/types/config/config.graphql',
	'./dist/types/graphql/schema/types/crash-reporting-enabled/crash-reporting-enabled.graphql',
	'./dist/types/graphql/schema/types/devices/device.graphql',
	'./dist/types/graphql/schema/types/disks/disk.graphql',
	'./dist/types/graphql/schema/types/display/icons.graphql',
	'./dist/types/graphql/schema/types/docker/container.graphql',
	'./dist/types/graphql/schema/types/docker/network.graphql',
	'./dist/types/graphql/schema/types/flash/flash.graphql',
	'./dist/types/graphql/schema/types/info/apps.graphql',
	'./dist/types/graphql/schema/types/info/baseboard.graphql',
	'./dist/types/graphql/schema/types/info/cpu.graphql',
	'./dist/types/graphql/schema/types/info/devices.graphql',
	'./dist/types/graphql/schema/types/info/display.graphql',
	'./dist/types/graphql/schema/types/info/machine-id.graphql',
	'./dist/types/graphql/schema/types/info/memory.graphql',
	'./dist/types/graphql/schema/types/info/os.graphql',
	'./dist/types/graphql/schema/types/info/system.graphql',
	'./dist/types/graphql/schema/types/info/versions.graphql',
	'./dist/types/graphql/schema/types/info/vms.graphql',
	'./dist/types/graphql/schema/types/mothership/mothership.graphql',
	'./dist/types/graphql/schema/types/notifications/notifications.graphql',
	'./dist/types/graphql/schema/types/owner/owner.graphql',
	'./dist/types/graphql/schema/types/registration/registration.graphql',
	'./dist/types/graphql/schema/types/scopes/scope.graphql',
	'./dist/types/graphql/schema/types/servers/server.graphql',
	'./dist/types/graphql/schema/types/services/service.graphql',
	'./dist/types/graphql/schema/types/shares/share.graphql',
	'./dist/types/graphql/schema/types/two-factor/two-factor.graphql',
	'./dist/types/graphql/schema/types/unassigned-devices/mount.graphql',
	'./dist/types/graphql/schema/types/unassigned-devices/partition.graphql',
	'./dist/types/graphql/schema/types/unassigned-devices/unassigned-device.graphql',
	'./dist/types/graphql/schema/types/users/me.graphql',
	'./dist/types/graphql/schema/types/users/user.graphql',
	'./dist/types/graphql/schema/types/vars/vars.graphql',
	'./dist/types/graphql/schema/types/vms/domain.graphql',
	'./dist/types/graphql/schema/types/vms/network.graphql'
].map(file => readFileSync(file, 'utf8'));

export const typeDefs = mergeTypeDefs(files);
