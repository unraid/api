#!/usr/bin/env node
// Run inside a managed, disposable Unraid QA guest after installing the pinned plugin.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, readdir, rename, rm, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
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
    unread: list(filter: {type: UNREAD, offset: 0, limit: 10000}) {id title subject description importance link}
    archive: list(filter: {type: ARCHIVE, offset: 0, limit: 10000}) {id title subject description importance link}
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

async function waitUntil(predicate, label, timeout = 15000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (await predicate()) return;
        await delay(100);
    }
    throw new Error(`Timed out: ${label}`);
}

function apiProcess() {
    const require = createRequire(entrypoint);
    const list = JSON.parse(execFileSync(process.execPath, [require.resolve('pm2/bin/pm2'), 'jlist'], {
        encoding: 'utf8', timeout: 10000,
        env: { ...process.env, PM2_HOME: '/var/log/.pm2', PM2_DISCRETE_MODE: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
    }));
    const app = list.find((app) => app.name === 'unraid-api' && app.pm2_env.pm_exec_path === entrypoint);
    assert(app?.pid > 0, 'API process not running');
    return { pid: app.pid, restarts: app.pm2_env.restart_time };
}

async function observeSubscriptions() {
    const require = createRequire(entrypoint);
    const WebSocket = require('ws');
    const socket = new WebSocket(endpoint.replace(/^http/, 'ws'), 'graphql-transport-ws', {
        headers: { 'x-api-key': key },
    });
    const messages = [];
    let failure = false;
    socket.on('error', () => { failure = true; });
    socket.on('message', (bytes) => {
        try { messages.push(JSON.parse(bytes.toString())); } catch { failure = true; }
    });
    socket.on('open', () => socket.send(JSON.stringify({
        type: 'connection_init', payload: { 'x-api-key': key },
    })));
    const until = async (predicate, label) => waitUntil(() => {
        assert(!failure && !messages.some((m) => m.type === 'error' || m.payload?.errors), 'Subscription failed');
        return predicate();
    }, label);
    try {
        await until(() => messages.some((m) => m.type === 'connection_ack'), 'WebSocket acknowledgement');
        const fields = {
            added: 'notificationAdded {id title subject importance}',
            overview: `notificationsOverview {${overviewFields}}`,
            warnings: 'notificationsWarningsAndAlerts {id title subject importance}',
        };
        for (const [id, field] of Object.entries(fields)) {
            socket.send(JSON.stringify({ id, type: 'subscribe', payload: { query: `subscription {${field}}` } }));
        }
        return {
            messages,
            until,
            close: async () => {
                socket.close();
                try { await waitUntil(() => socket.readyState === WebSocket.CLOSED, 'WebSocket close', 2000); }
                finally { if (socket.readyState !== WebSocket.CLOSED) socket.terminate(); }
            },
        };
    } catch (error) {
        socket.terminate();
        throw error;
    }
}

async function adversarial() {
    stage = 'adversarial preflight';
    assert.equal(process.env.QA_ALLOW_SERVICE_RESTART, 'true', 'Explicit disposable-guest restart permission required');
    const config = JSON.parse(execFileSync('/usr/bin/php', ['-r',
        '$docroot="/usr/local/emhttp"; require_once "$docroot/webGui/include/Wrappers.php"; '
        + '$c=parse_plugin_cfg("dynamix",true); echo json_encode($c["notify"]);',
    ], { encoding: 'utf8', timeout: 10000 }));
    for (const severity of ['normal', 'warning', 'alert']) {
        assert.equal(Number(config[severity]), 1, 'Native API creation requires browser-only notification settings');
    }
    const baseline = await graphql(query);
    assert.equal(baseline.notifications.unread.length + baseline.notifications.archive.length, 0,
        'Adversarial bulk tests require an isolated empty notification directory');
    let observer = await observeSubscriptions();
    try {
        stage = 'native API creation and subscriptions';
        const title = `${prefix}_api`;
        const { createNotification: created } = await graphql(`mutation($input: NotificationData!) {
            createNotification(input: $input) {id title subject description importance link}
        }`, { input: { title, subject: 'Quoted "subject" = value', description: 'Notification QA & content',
            importance: 'WARNING', link: '/Settings/Notifications' } });
        const state = await verify('API creation through installed native notifier', { unread: 1, archive: 0 });
        const actual = state.unread.find((n) => n.title === title);
        assert(actual, 'Created notification absent from list');
        // A native archive copy proves the API did not take its local-write fallback.
        await access(join(notificationPath, 'archive', localId(actual.id)));
        assert.equal(created.subject, 'Quoted "subject" = value');
        for (const field of ['title', 'subject', 'description', 'importance', 'link']) {
            assert.equal(actual[field], created[field], 'Native file metadata differs from API creation response');
        }
        report.nativeCreateReturnedIdMatchesDisk = localId(created.id) === localId(actual.id);
        await observer.until(() => observer.messages.some((m) => m.id === 'added'
            && m.payload?.data?.notificationAdded?.title === title), 'live notificationAdded');
        await observer.until(() => observer.messages.some((m) => m.id === 'overview'
            && m.payload?.data?.notificationsOverview?.unread.warning === 1), 'live notificationsOverview');
        await observer.until(() => observer.messages.some((m) => m.id === 'warnings'
            && m.payload?.data?.notificationsWarningsAndAlerts?.some((n) => n.title === title)), 'live warning subscription');
        checks.push({ label: 'three authenticated live GraphQL subscriptions', passed: true });
        const original = await readFile(join(notificationPath, 'unread', localId(actual.id)), 'utf8');
        await writeFile(join(notificationPath, 'unread', localId(actual.id)),
            original.replace(/^subject=.*$/m, 'subject="Changed content"'));
        await observer.until(() => observer.messages.some((m) => m.id === 'warnings'
            && m.payload?.data?.notificationsWarningsAndAlerts?.some((n) => n.title === title
                && n.subject === 'Changed content')), 'warning content update without count change');
        checks.push({ label: 'live content update at unchanged severity', passed: true });
        await mutation('archiveNotification', actual.id);
        await verify('API-created notification can be archived by its listed ID', { unread: 0, archive: 1 });
        await observer.until(() => observer.messages.some((m) => m.id === 'warnings'
            && m.payload?.data?.notificationsWarningsAndAlerts?.length === 0), 'warning removal subscription');
        await cleanup();

        stage = 'bulk regression';
        const ids = ['normal', 'warning', 'alert'].map((s) => notify(`${prefix}_bulk_${s}`, s));
        await verify('bulk seed', { unread: 3, archive: 0 });
        await observer.until(() => ids.every((id) => observer.messages.some((m) => m.id === 'added'
            && localId(m.payload?.data?.notificationAdded?.id ?? '') === id)), 'native bulk add events');
        for (const id of ids) {
            const additions = observer.messages.filter((m) => m.id === 'added'
                && localId(m.payload?.data?.notificationAdded?.id ?? '') === id);
            assert.equal(additions.length, 1, 'Native add was lost or published more than once');
        }
        checks.push({ label: 'one live notificationAdded per new native file', passed: true });
        notify(`${prefix}_bulk_normal`, 'normal');
        await verify('repeated native ticket creates no duplicate', { unread: 3, archive: 0 });
        await graphql(`mutation($ids: [PrefixedID!]!) {archiveNotifications(ids: $ids) {${overviewFields}}}`, { ids: ids.slice(0, 2) });
        await verify('bulk archive selected IDs', { unread: 1, archive: 2 });
        await graphql(`mutation($ids: [PrefixedID!]!) {unarchiveNotifications(ids: $ids) {${overviewFields}}}`, { ids: ids.slice(0, 2) });
        await verify('bulk restore selected IDs', { unread: 3, archive: 0 });
        await graphql(`mutation {archiveAll(importance: WARNING) {${overviewFields}}}`);
        await verify('bulk archive by severity', { unread: 2, archive: 1 });
        await graphql(`mutation {unarchiveAll(importance: WARNING) {${overviewFields}}}`);
        await verify('bulk restore by severity', { unread: 3, archive: 0 });
        await graphql(`mutation {archiveAll {${overviewFields}}}`);
        await verify('archive all', { unread: 0, archive: 3 });
        await graphql(`mutation {unarchiveAll {${overviewFields}}}`);
        await verify('restore all', { unread: 3, archive: 0 });
        await graphql(`mutation {archiveAll {${overviewFields}}}`);
        await graphql(`mutation {deleteArchivedNotifications {${overviewFields}}}`);
        await verify('delete all archived', { unread: 0, archive: 0 });
        await observer.close();
        observer = null;

        stage = 'restart persistence';
        const persistent = notify(`${prefix}_restart`, 'alert');
        await verify('before service restart', { unread: 1, archive: 0 });
        const before = apiProcess();
        execFileSync('/etc/rc.d/rc.unraid-api', ['restart'], { timeout: 60000, stdio: 'pipe' });
        await verify('rehydrates persisted native copies after restart', { unread: 1, archive: 0 });
        assert.notEqual(apiProcess().pid, before.pid, 'API process did not restart');
        observer = await observeSubscriptions();
        const reconnect = notify(`${prefix}_reconnect`, 'warning');
        await verify('new native write after restart', { unread: 2, archive: 0 });
        await observer.until(() => observer.messages.some((m) => m.id === 'added'
            && localId(m.payload?.data?.notificationAdded?.id ?? '') === reconnect), 'subscription after restart');
        checks.push({ label: 'authenticated live subscription after restart', passed: true });
        await observer.close();
        observer = null;

        stage = 'startup filesystem failure';
        const unread = join(notificationPath, 'unread');
        const saved = join(notificationPath, `${prefix}_saved_unread`);
        await rename(unread, saved);
        await writeFile(unread, 'blocked directory');
        try {
            execFileSync('/etc/rc.d/rc.unraid-api', ['restart'], { timeout: 60000, stdio: 'pipe' });
            const failedProcess = apiProcess();
            const response = await fetch(endpoint, { method: 'POST',
                headers: { 'content-type': 'application/json', 'x-api-key': key },
                body: JSON.stringify({ query }), signal: AbortSignal.timeout(10000) });
            const body = await response.json();
            assert(body.errors?.length, 'Invalid directory did not expose an initialization error');
            await unlink(unread);
            await rename(saved, unread);
            await verify('recovers startup directory failure without another restart', { unread: 2, archive: 0 });
            assert.deepEqual(apiProcess(), failedProcess, 'Process restarted instead of recovering');
        } finally {
            try { await access(saved); await rm(unread, { recursive: true, force: true }); await rename(saved, unread); }
            catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        await mutation('archiveNotification', persistent);
        await verify('mutation after initialization recovery', { unread: 1, archive: 1 });

        stage = 'runtime native watcher error';
        const limitPath = '/proc/sys/fs/inotify/max_user_watches';
        const originalLimit = await readFile(limitPath, 'utf8');
        const logPath = '/var/log/graphql-api.log';
        const oldLogLength = (await readFile(logPath)).length;
        const running = apiProcess();
        const faultDirectory = join(notificationPath, `${prefix}_watch_fault`);
        try {
            await writeFile(limitPath, '1\n');
            await mkdir(faultDirectory);
            await waitUntil(async () => (await readFile(logPath, 'utf8')).slice(oldLogLength).includes('ENOSPC'),
                'actual inotify resource exhaustion');
        } finally {
            await writeFile(limitPath, originalLimit);
            await rm(faultDirectory, { recursive: true, force: true });
        }
        assert.deepEqual(apiProcess(), running, 'Watcher error restarted the API process');
        notify(`${prefix}_after_watch_error`, 'normal');
        await verify('counts follow real writes after logged ENOSPC without process restart', { unread: 2, archive: 1 });
        checks.push({ label: 'native inotify error logged; process and counts remain operational', passed: true });
    } finally {
        await observer?.close();
    }
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
    if (process.env.QA_ADVERSARIAL === 'true') {
        await cleanup();
        await adversarial();
    }
    report.status = report.nativeCreateReturnedIdMatchesDisk === false ? 'passed_with_findings' : 'passed';
    if (report.status === 'passed_with_findings') process.exitCode = 1;
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
