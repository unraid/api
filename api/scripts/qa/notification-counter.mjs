#!/usr/bin/env node
// Run inside a managed, disposable Unraid QA guest after installing the pinned plugin.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const required = (name) => {
    assert(process.env[name], `Missing ${name}`);
    return process.env[name];
};
const endpoint = required('QA_GRAPHQL_URL');
const key = required('QA_API_KEY');
const entrypoint = required('QA_API_ENTRYPOINT');
const expectedHash = required('QA_API_SHA256');
const revision = required('QA_SOURCE_REVISION');
const reportPath = required('QA_REPORT_PATH');
assert(/^[a-f0-9]{64}$/.test(expectedHash), 'Expected packaged API SHA-256');
assert(/^[a-f0-9]{40}$/.test(revision), 'Expected exact source commit');
assert(isAbsolute(entrypoint) && isAbsolute(reportPath), 'Use absolute guest paths');
const notifier = '/usr/local/emhttp/webGui/scripts/notify';
const prefix = `qa1859_${randomUUID().replaceAll('-', '')}`;
const checks = [];
const report = { revision, checks, status: 'running' };
let notificationPath;
let stage = 'preflight';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const counts = '{info warning alert total}';
const overviewFields = `unread ${counts} archive ${counts}`;
const query = `query { notifications {
    overview { ${overviewFields} }
    unread: list(filter: {type: UNREAD, offset: 0, limit: 10000}) {id title importance}
    archive: list(filter: {type: ARCHIVE, offset: 0, limit: 10000}) {id title importance}
} }`;

async function graphql(query, variables = {}) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, 200, `GraphQL HTTP ${response.status}`);
    const body = await response.json();
    assert(!body.errors?.length, `GraphQL errors: ${body.errors?.map((e) => e.message).join('; ')}`);
    return body.data;
}

const emptyCounts = () => ({ info: 0, warning: 0, alert: 0, total: 0 });
function summarize(notifications) {
    const result = emptyCounts();
    for (const notification of notifications) {
        const importance = notification.importance.toLowerCase();
        assert(Object.hasOwn(result, importance) && importance !== 'total', 'Unknown importance');
        result[importance]++;
        result.total++;
    }
    return result;
}
const localId = (id) => id.split(':').at(-1);
async function diskState() {
    const state = {};
    for (const type of ['unread', 'archive']) {
        state[type] = [];
        for (const id of await readdir(join(notificationPath, type))) {
            if (!id.endsWith('.notify')) continue;
            const text = await readFile(join(notificationPath, type, id), 'utf8');
            const severity = text.match(/^importance\s*=\s*"?(normal|warning|alert)"?\s*$/m)?.[1];
            assert(severity, 'Disk fixture has unsupported importance; cannot establish ground truth');
            state[type].push({ id, importance: severity === 'normal' ? 'INFO' : severity.toUpperCase() });
        }
    }
    const unreadIds = new Set(state.unread.map((n) => n.id));
    state.archive = state.archive.filter((n) => !unreadIds.has(n.id));
    return state;
}

async function verify(label, fixtureCounts) {
    stage = label;
    const deadline = Date.now() + 15000;
    let lastError;
    do {
        try {
            const disk = await diskState();
            const { notifications } = await graphql(query);
            const fixtureOverview = {};
            for (const type of ['unread', 'archive']) {
                const list = notifications[type];
                assert(list.length < 10000, 'List cap reached; cannot establish complete ground truth');
                assert.deepEqual(list.map((n) => localId(n.id)).sort(), disk[type].map((n) => n.id).sort());
                assert.deepEqual(notifications.overview[type], summarize(disk[type]));
                assert.deepEqual(notifications.overview[type], summarize(list));
                fixtureOverview[type] = summarize(list.filter((n) => n.title.startsWith(prefix)));
                assert.equal(fixtureOverview[type].total, fixtureCounts[type]);
            }
            checks.push({ label, fixtureOverview, diskMatchesListsAndCounters: true });
            console.log(`PASS ${label}`);
            return notifications;
        } catch (error) {
            lastError = error;
            await delay(150);
        }
    } while (Date.now() < deadline);
    throw new Error(`${label}: ${lastError.message}`);
}

function notify(event, severity, archiveOnly = false) {
    execFileSync(notifier, [
        '-e', event, '-s', 'Notification counter QA', '-d', 'Disposable notification fixture',
        '-i', `${severity} 1`, '-x', ...(archiveOnly ? ['-b'] : []),
    ], { timeout: 10000, stdio: 'pipe' });
    return `${event}_ticket.notify`;
}
async function mutation(name, id) {
    return graphql(`mutation($id: PrefixedID!) { ${name}(id: $id) { id } }`, { id });
}
async function cleanup() {
    if (!notificationPath) return;
    for (const type of ['unread', 'archive']) {
        for (const id of await readdir(join(notificationPath, type))) {
            if (id.startsWith(prefix) && id.endsWith('.notify')) {
                await unlink(join(notificationPath, type, id));
            }
        }
    }
    await verify('fixture cleanup', { unread: 0, archive: 0 });
}

// Write a fresh private report before mutations; never overwrite another run's evidence.
await writeFile(reportPath, JSON.stringify(report), { flag: 'wx', mode: 0o600 });
try {
    await access('/boot/config/qa-harness-ok');
    const apiBytes = await readFile(entrypoint);
    report.apiSha256 = hash(apiBytes);
    assert.equal(report.apiSha256, expectedHash, 'Installed API differs from pinned package');
    const script = await readFile(notifier, 'utf8');
    report.notifierSha256 = hash(script);
    assert(script.includes('$overrule') && script.includes('strtok'), 'Notifier delivery override unavailable');
    // The native parser resolves defaults and persistent settings exactly as notify does.
    const config = JSON.parse(execFileSync('/usr/bin/php', ['-r',
        '$docroot="/usr/local/emhttp"; require_once "$docroot/webGui/include/Wrappers.php"; '
        + '$c=parse_plugin_cfg("dynamix",true); echo json_encode($c["notify"]["path"] ?? "/tmp/notifications");',
    ], { timeout: 10000, encoding: 'utf8' }));
    assert(typeof config === 'string' && isAbsolute(config), 'Invalid configured notification path');
    notificationPath = config;
    await verify('baseline', { unread: 0, archive: 0 });
    const ids = ['normal', 'warning', 'alert'].map((severity) => notify(`${prefix}_${severity}`, severity));
    for (const id of ids) {
        await access(join(notificationPath, 'unread', id));
        await access(join(notificationPath, 'archive', id));
    }
    const created = await verify('native dual writes, all severities', { unread: 3, archive: 0 });
    assert.deepEqual(summarize(created.unread.filter((n) => n.title.startsWith(prefix))),
        { info: 1, warning: 1, alert: 1, total: 3 });
    execFileSync(notifier, ['archive', ids[0]], { timeout: 10000, stdio: 'pipe' });
    await verify('native archive reveals existing archive copy', { unread: 2, archive: 1 });
    await mutation('unreadNotification', ids[0]);
    await verify('API restore', { unread: 3, archive: 0 });
    await mutation('archiveNotification', ids[1]);
    await verify('API archive replaces duplicate', { unread: 2, archive: 1 });
    await graphql(`mutation($id: PrefixedID!) {
        deleteNotification(id: $id, type: ARCHIVE) { ${overviewFields} }
    }`, { id: ids[1] });
    await verify('API archive deletion', { unread: 2, archive: 0 });
    const alertPath = join(notificationPath, 'unread', ids[2]);
    const text = await readFile(alertPath, 'utf8');
    await writeFile(alertPath, text.replace(/^importance=.*$/m, 'importance="warning"'));
    const changed = await verify('external severity change', { unread: 2, archive: 0 });
    assert.deepEqual(summarize(changed.unread.filter((n) => n.title.startsWith(prefix))),
        { info: 1, warning: 1, alert: 0, total: 2 });
    await unlink(alertPath);
    await verify('external unread deletion reveals archive severity', { unread: 1, archive: 1 });
    notify(`${prefix}_archive_only`, 'normal', true);
    await verify('native archive-only write', { unread: 1, archive: 2 });
    for (let i = 0; i < 12; i++) notify(`${prefix}_burst_${i}`, ['normal', 'warning', 'alert'][i % 3]);
    await verify('native burst of 24 file writes', { unread: 13, archive: 2 });
    report.status = 'passed';
} catch (error) {
    report.status = 'failed';
    // Never include credentials, endpoint, or existing notification contents in the receipt.
    report.failedStage = stage;
    report.errorType = error.name;
    process.exitCode = 1;
} finally {
    try {
        await cleanup();
        report.cleanup = 'complete';
    } catch {
        report.cleanup = 'failed';
        report.status = 'failed';
        process.exitCode = 1;
    }
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    console.log(`Result: ${report.status}; cleanup: ${report.cleanup}`);
}
