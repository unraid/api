import { promisify } from 'util';
import { join as joinPath } from 'path';
import { exec as execWithCallback } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import tempy from 'tempy';
import ava, { TestInterface } from 'ava';

const exec = promisify(execWithCallback);

const test = ava as TestInterface<{ paths: Record<string, string> }>;

const repeat = async (func: () => void, times = 0) => {
	let promise = Promise.resolve();

	while (times-- > 0) {
		promise = promise.then(func);
	}

	return promise;
};

test.beforeEach(t => {
	t.context = {
		paths: {
			PATHS_MYSERVERS_ENV: tempy.file({ name: 'env' }),
			PATHS_UNRAID_API_BASE: tempy.directory()
		}
	};

	writeFileSync(t.context.paths.PATHS_MYSERVERS_ENV, 'env="production"');
	writeFileSync(joinPath(t.context.paths.PATHS_UNRAID_API_BASE, '.env.staging'), 'env="staging"');
	writeFileSync(joinPath(t.context.paths.PATHS_UNRAID_API_BASE, '.env.production'), 'env="production"');
});

test.serial('Loads production when no env is set', async t => {
	t.plan(30);

	await repeat(async () => {
		const { PATHS_MYSERVERS_ENV, PATHS_UNRAID_API_BASE } = t.context.paths;

		// No env
		writeFileSync(PATHS_MYSERVERS_ENV, '');

		// Run 'switch-env'
		const { stdout: output } = await exec(`PATHS_MYSERVERS_ENV=${PATHS_MYSERVERS_ENV} PATHS_UNRAID_API_BASE=${PATHS_UNRAID_API_BASE} ${process.execPath} ./dist/cli.js switch-env`);

		// Check the output of the cli
		t.is(output, 'Current ENV in file: undefined\nNo ENV found, setting env to "production"...\nRun "unraid-api start" to start the API.\n');

		// Check the .env was updated on the live server
		t.is(readFileSync(joinPath(PATHS_UNRAID_API_BASE, '.env'), 'utf-8'), 'env="production"');

		// Check the env file that's persisted on the boot drive
		t.is(readFileSync(PATHS_MYSERVERS_ENV, 'utf-8'), 'env="production"');
	}, 10);
});

test.serial('Loads production when switching from staging', async t => {
	t.plan(30);

	await repeat(async () => {
		const { PATHS_MYSERVERS_ENV, PATHS_UNRAID_API_BASE } = t.context.paths;

		// Staging
		writeFileSync(PATHS_MYSERVERS_ENV, 'env="staging"');

		// Run 'switch-env'
		const { stdout: output } = await exec(`PATHS_MYSERVERS_ENV=${PATHS_MYSERVERS_ENV} PATHS_UNRAID_API_BASE=${PATHS_UNRAID_API_BASE} ${process.execPath} ./dist/cli.js switch-env`);

		// Check the output of the cli
		t.is(output, 'Current ENV in file: staging\nSwitching from "staging" to "production"...\nRun "unraid-api start" to start the API.\n');

		// Check the .env was updated on the live server
		t.is(readFileSync(joinPath(PATHS_UNRAID_API_BASE, '.env'), 'utf-8'), 'env="production"');

		// Check the env file that's persisted on the boot drive
		t.is(readFileSync(PATHS_MYSERVERS_ENV, 'utf-8'), 'env="production"');
	}, 10);
});

test.serial('Loads staging when switching from production', async t => {
	t.plan(30);

	await repeat(async () => {
		const { PATHS_MYSERVERS_ENV, PATHS_UNRAID_API_BASE } = t.context.paths;

		// Production
		writeFileSync(PATHS_MYSERVERS_ENV, 'env="production"');

		// Run 'switch-env'
		const { stdout: output } = await exec(`PATHS_MYSERVERS_ENV=${PATHS_MYSERVERS_ENV} PATHS_UNRAID_API_BASE=${PATHS_UNRAID_API_BASE} ${process.execPath} ./dist/cli.js switch-env`);

		// Check the output of the cli
		t.is(output, 'Current ENV in file: production\nSwitching from "production" to "staging"...\nRun "unraid-api start" to start the API.\n');

		// Check the .env was updated on the live server
		t.is(readFileSync(joinPath(PATHS_UNRAID_API_BASE, '.env'), 'utf-8'), 'env="staging"');

		// Check the env file that's persisted on the boot drive
		t.is(readFileSync(PATHS_MYSERVERS_ENV, 'utf-8'), 'env="staging"');
	}, 10);
});
