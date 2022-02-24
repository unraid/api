import { promisify } from 'util';
import { join as joinPath, resolve as resolvePath } from 'path';
import { exec as execWithCallback } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import tempy from 'tempy';
import ava, { TestInterface } from 'ava';

const exec = promisify(execWithCallback);

const test = ava as TestInterface<{ paths: Record<string, string> }>;

const stagingEnv = readFileSync(resolvePath(__dirname, '..', '.env.staging'), 'utf-8');
const productionEnv = readFileSync(resolvePath(__dirname, '..', '.env.production'), 'utf-8');

test.beforeEach(t => {
	t.context = {
		paths: {
			PATHS_MYSERVERS_ENV: tempy.file({ name: 'env' }),
			PATHS_UNRAID_API_BASE: tempy.directory()
		}
	};

	writeFileSync(t.context.paths.PATHS_MYSERVERS_ENV, 'env="production"');
	writeFileSync(joinPath(t.context.paths.PATHS_UNRAID_API_BASE, '.env.staging'), stagingEnv);
	writeFileSync(joinPath(t.context.paths.PATHS_UNRAID_API_BASE, '.env.production'), productionEnv);
});

test.serial('Loads production when no env is set', async t => {
	const { PATHS_MYSERVERS_ENV, PATHS_UNRAID_API_BASE } = t.context.paths;

	// No env
	writeFileSync(PATHS_MYSERVERS_ENV, '');

	// Run 'switch-env'
	const { stdout: output } = await exec(`LOG_LEVEL=info LOG_TRANSPORT=out DEBUG=true LOG_TYPE=raw PATHS_MYSERVERS_ENV=${PATHS_MYSERVERS_ENV} PATHS_UNRAID_API_BASE=${PATHS_UNRAID_API_BASE} ${process.execPath} ./dist/cli.js switch-env`);

	// Split the lines
	const lines = output.split('\n');

	// Check the output of the cli
	t.is(lines[0], 'Now using production');
	t.is(lines[0], 'Run "unraid-api start" to start the API.');

	// Check the .env was updated on the live server
	t.is(readFileSync(joinPath(PATHS_UNRAID_API_BASE, '.env'), 'utf-8'), productionEnv);

	// Check the env file that's persisted on the boot drive
	t.is(readFileSync(PATHS_MYSERVERS_ENV, 'utf-8'), 'env="production"');
});

test.serial('Loads production when switching from staging', async t => {
	const { PATHS_MYSERVERS_ENV, PATHS_UNRAID_API_BASE } = t.context.paths;

	// Staging
	writeFileSync(PATHS_MYSERVERS_ENV, 'env="staging"');

	// Run 'switch-env'
	const { stdout: output } = await exec(`LOG_TRANSPORT=out LOG_TYPE=raw PATHS_MYSERVERS_ENV=${PATHS_MYSERVERS_ENV} PATHS_UNRAID_API_BASE=${PATHS_UNRAID_API_BASE} ${process.execPath} ./dist/cli.js switch-env`);

	// Split the lines
	const lines = output.split('\n');

	// Check the output of the cli
	t.is(lines[0], 'Now using production');
	t.is(lines[1], 'Run "unraid-api start" to start the API.');

	// Check the .env was updated on the live server
	t.is(readFileSync(joinPath(PATHS_UNRAID_API_BASE, '.env'), 'utf-8'), productionEnv);

	// Check the env file that's persisted on the boot drive
	t.is(readFileSync(PATHS_MYSERVERS_ENV, 'utf-8'), 'env="production"');
});

test.serial('Loads staging when switching from production', async t => {
	const { PATHS_MYSERVERS_ENV, PATHS_UNRAID_API_BASE } = t.context.paths;

	// Production
	writeFileSync(PATHS_MYSERVERS_ENV, 'env="production"');

	// Run 'switch-env'
	const { stdout: output } = await exec(`LOG_LEVEL=info LOG_TRANSPORT=out LOG_TYPE=raw PATHS_MYSERVERS_ENV=${PATHS_MYSERVERS_ENV} PATHS_UNRAID_API_BASE=${PATHS_UNRAID_API_BASE} ${process.execPath} ./dist/cli.js switch-env`);

	// Split the lines
	const lines = output.split('\n');

	// Check the output of the cli
	t.is(lines[0], 'Now using staging');
	t.is(lines[1], 'Run "unraid-api start" to start the API.');

	// Check the .env was updated on the live server
	t.is(readFileSync(joinPath(PATHS_UNRAID_API_BASE, '.env'), 'utf-8'), stagingEnv);

	// Check the env file that's persisted on the boot drive
	t.is(readFileSync(PATHS_MYSERVERS_ENV, 'utf-8'), 'env="staging"');
});
