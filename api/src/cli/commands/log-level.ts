import { getAllUnraidApiPids } from "@app/cli/get-unraid-api-pid";

export const increaseLogLevel = async () => {
	const unraidApiPids = await getAllUnraidApiPids();
    unraidApiPids.forEach(pid => process.kill(pid, 'SIGUSR1'));
};

export const decreaseLogLevel = async () => {
	const unraidApiPids = await getAllUnraidApiPids();
    unraidApiPids.forEach(pid => process.kill(pid, 'SIGUSR2'));
};