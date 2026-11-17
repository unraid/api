import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const page = fileURLToPath(
    new URL(
        '../source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.plugin.manager/Downgrade.page',
        import.meta.url
    )
);
const nonce = 'a'.repeat(64);
const marked =
    '<?php\n// @unraid-downgrade-protocol nonce-v1\nthrow new Exception("Handler must never execute during page rendering");';

function harness(handler) {
    const root = mkdtempSync(join(tmpdir(), 'downgrade-page-'));
    function write(path, content) {
        const target = join(root, path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, content);
    }
    try {
        write(
            'plugins/dynamix/include/ReplaceKey.php',
            '<?php class ReplaceKey { function check() {} }'
        );
        write(
            'plugins/dynamix.my.servers/include/reboot-details.php',
            '<?php class RebootDetails { public $previousVersion = "7.4.0-beta.3.2"; public $rebootVersion = ""; public $previousReleaseDate = ""; function setPrevious() {} }'
        );
        if (handler !== null) write('plugins/dynamix.plugin.manager/include/Downgrade.php', handler);
        const rendered = execFileSync(
            'php',
            [
                '-d',
                'short_open_tag=1',
                '-r',
                '$docroot=$argv[1]; $var=["NAME"=>"Tower"]; if (!function_exists("_")) {function _($s) {return $s;}} include $argv[2];',
                root,
                page,
            ],
            { encoding: 'utf8' }
        );
        const script = rendered.match(/<script>([\s\S]*?)<\/script>/)?.[1];
        assert.ok(script);
        const posts = [];
        const dialogs = [];
        let refreshes = 0;
        const $ = () => ({ show() {}, hide() {} });
        $.param = (value) => new URLSearchParams(value).toString();
        $.post = (url, data, success, type) => {
            const call = { url, data, success, type, failure: null };
            posts.push(call);
            return {
                fail(callback) {
                    call.failure = callback;
                },
            };
        };
        const context = createContext({
            $,
            URL,
            NchanSubscriber: class {
                on() {}
            },
            swal: (...args) => dialogs.push(args),
            refresh: () => {
                refreshes++;
            },
        });
        runInContext(script, context);
        return {
            posts,
            dialogs,
            start: () => runInContext('startDowngrade()', context),
            confirm: () => runInContext('confirmDowngrade()', context),
            refreshes: () => refreshes,
        };
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

for (const release of ['6.12.15', '7.3.4']) {
    test(`stock ${release} makes one confirmed POST without a preparation request`, () => {
        const source = readFileSync(
            new URL(`./fixtures/downgrade/${release}.php`, import.meta.url),
            'utf8'
        );
        const h = harness(source);
        h.confirm();
        assert.equal(h.posts.length, 0);
        h.dialogs[0][1](false);
        assert.equal(h.posts.length, 0);
        h.dialogs[0][1](true);
        assert.equal(h.posts.length, 1);
        assert.equal(
            new URL(h.posts[0].url, 'http://tower.example.com').searchParams.get('version'),
            '7.4.0-beta.3.2'
        );
        assert.equal(h.posts[0].data.action, undefined);
        assert.equal(h.posts[0].type, 'text');
        h.posts[0].success('');
        assert.equal(h.refreshes(), 1);
    });
}

for (const source of [null, '<?php echo "unknown";', marked.replace('nonce-v1', 'nonce-v2')]) {
    test('missing or unknown handler causes no HTTP action', () => {
        const h = harness(source);
        h.start();
        assert.equal(h.posts.length, 0);
        assert.equal(h.dialogs.length, 1);
        assert.equal(h.refreshes(), 0);
    });
}

test('marked handler prepares, confirms the same nonce and refreshes only on success', () => {
    const h = harness(marked);
    h.start();
    assert.equal(h.posts.length, 1);
    assert.equal(h.posts[0].data.action, 'prepare');
    h.posts[0].success({ success: true, nonce });
    assert.equal(h.posts.length, 2);
    assert.equal(h.posts[1].data.nonce, nonce);
    assert.equal(h.posts[1].data.confirm, 'yes');
    assert.equal(h.posts[1].data.version, '7.4.0-beta.3.2');
    assert.equal(h.refreshes(), 0);
    h.posts[1].success({ success: true });
    assert.equal(h.refreshes(), 1);
});

for (const response of [
    null,
    {},
    { nonce },
    { success: false, nonce },
    { success: true, nonce: 'invalid' },
]) {
    test('invalid prepare response never confirms or falls back', () => {
        const h = harness(marked);
        h.start();
        h.posts[0].success(response);
        assert.equal(h.posts.length, 1);
        assert.equal(h.refreshes(), 0);
        assert.equal(h.dialogs.length, 1);
    });
}

for (const response of [null, {}, { success: false }]) {
    test('invalid confirmation response never refreshes or falls back', () => {
        const h = harness(marked);
        h.start();
        h.posts[0].success({ success: true, nonce });
        h.posts[1].success(response);
        assert.equal(h.posts.length, 2);
        assert.equal(h.refreshes(), 0);
        assert.equal(h.dialogs.length, 1);
    });
}

test('HTTP failure never falls back to the legacy action', () => {
    const h = harness(marked);
    h.start();
    h.posts[0].failure({ responseJSON: { error: 'Unavailable' } });
    assert.equal(h.posts.length, 1);
    assert.equal(h.refreshes(), 0);
    assert.equal(h.dialogs[0][0].text, 'Unavailable');
});

test('confirmation HTTP failure reports the error without refreshing', () => {
    const h = harness(marked);
    h.start();
    h.posts[0].success({ success: true, nonce });
    h.posts[1].failure({ responseJSON: { error: 'Busy' } });
    assert.equal(h.posts.length, 2);
    assert.equal(h.refreshes(), 0);
    assert.equal(h.dialogs[0][0].text, 'Busy');
});

test('legacy HTTP failure reports the error without retrying', () => {
    const h = harness(readFileSync(new URL('./fixtures/downgrade/7.3.4.php', import.meta.url), 'utf8'));
    h.start();
    h.posts[0].failure({ responseJSON: { error: 'Unavailable' } });
    assert.equal(h.posts.length, 1);
    assert.equal(h.refreshes(), 0);
    assert.equal(h.dialogs[0][0].text, 'Unavailable');
});

test('update cancellation refuses a shared boot-operation lock', () => {
    const root = mkdtempSync(join(tmpdir(), 'update-cancel-'));
    try {
        const lock = join(root, 'boot-update.lock');
        const cancel = join(root, 'cancel.php');
        const source = readFileSync(
            new URL(
                '../source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.plugin.manager/include/UnraidUpdateCancel.php',
                import.meta.url
            ),
            'utf8'
        );
        writeFileSync(
            cancel,
            source
                .replaceAll('/boot', join(root, 'boot'))
                .replaceAll('/var/run/unraid-boot-update.lock', lock)
        );
        // A separately opened descriptor must contend even within the same PHP process.
        const output = execFileSync(
            'php',
            [
                '-r',
                '$owner=fopen($argv[1],"c"); flock($owner,LOCK_EX); ob_start(); include $argv[2]; $body=ob_get_clean(); echo json_encode(["status"=>http_response_code(),"body"=>json_decode($body,true)]);',
                lock,
                cancel,
            ],
            { encoding: 'utf8' }
        );
        const response = JSON.parse(output);
        assert.equal(response.status, 409);
        assert.equal(response.body.success, false);
        assert.equal(response.body.busy, true);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
