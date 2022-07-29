import { apiManager } from "@app/core";
import { varState } from "@app/core/states";
import { version } from "systeminformation";

export const getRelayHeaders = () => {
	const apiKey = apiManager.cloudKey!;
	const serverName = `${varState.data.name}`;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': varState.data?.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': version,
	};
};