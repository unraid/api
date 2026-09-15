#!/usr/bin/env php
<?php
/**
 * OsRelease Test Suite
 *
 * Exit codes:
 *   0 - All tests passed
 *   1 - One or more tests failed
 */

// Stand-in for the webGui PluginHelpers plugin() function used on Unraid 7.
function plugin($method, $plugin_file, $default = false) {
    return $method === 'category' ? "next\n" : $default;
}

require_once __DIR__ . '/../source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/os-release.php';

class OsReleaseTest {
    private $dir;
    private $passed = 0;
    private $failed = 0;

    const RED = "\033[0;31m";
    const GREEN = "\033[0;32m";
    const NC = "\033[0m";

    public function run() {
        $this->dir = sys_get_temp_dir() . '/os-release-test-' . uniqid();
        mkdir($this->dir, 0755, true);
        try {
            $this->runTests();
        } finally {
            $this->cleanup($this->dir);
        }
        echo "\nResults: {$this->passed} passed, {$this->failed} failed\n";
        return $this->failed === 0 ? 0 : 1;
    }

    private function path($name) {
        return $this->dir . '/' . $name;
    }

    private function write($name, $contents) {
        file_put_contents($this->path($name), $contents);
        return $this->path($name);
    }

    private function branch($plg, $ostree, array $configs) {
        return OsRelease::branch([$this->path($plg)], $this->path($ostree), array_map([$this, 'path'], $configs));
    }

    private function assertSame($expected, $actual, $label) {
        if ($expected === $actual) {
            $this->passed++;
            echo self::GREEN . "PASS" . self::NC . " $label\n";
        } else {
            $this->failed++;
            echo self::RED . "FAIL" . self::NC . " $label: expected " . var_export($expected, true) . ", got " . var_export($actual, true) . "\n";
        }
    }

    private function runTests() {
        $this->write('unRAIDServer.plg', '<PLUGIN category="next"></PLUGIN>');
        $this->assertSame('next', $this->branch('unRAIDServer.plg', 'missing-ostree', []), 'Unraid 7 uses the OS plugin category');

        $this->write('os-update.json', json_encode(['branch' => 'preview', 'other' => 1]));
        $this->assertSame('next', $this->branch('unRAIDServer.plg', 'ostree-booted', ['os-update.json']), 'OS plugin category wins over the updater config');

        $this->assertSame('stable', $this->branch('missing.plg', 'missing-ostree', ['os-update.json']), 'Non-OSTree host without an OS plugin defaults to stable');

        $this->write('ostree-booted', '');
        $this->assertSame('preview', $this->branch('missing.plg', 'ostree-booted', ['os-update.json']), 'OSTree host reads branch from os-update.json');

        $this->write('etc-os-update.json', json_encode(['branch' => 'next']));
        $this->assertSame('next', $this->branch('missing.plg', 'ostree-booted', ['missing.json', 'etc-os-update.json']), 'OSTree host falls back to the image default config');

        $this->assertSame('stable', $this->branch('missing.plg', 'ostree-booted', ['missing.json']), 'OSTree host without any updater config defaults to stable');

        $this->write('malformed.json', '{"branch": "preview"');
        $this->assertSame('preview', $this->branch('missing.plg', 'ostree-booted', ['malformed.json', 'os-update.json']), 'Malformed config is skipped without throwing');
        $this->assertSame('stable', $this->branch('missing.plg', 'ostree-booted', ['malformed.json']), 'Malformed config alone defaults to stable');

        $this->write('no-branch.json', json_encode(['channel' => 'preview']));
        $this->assertSame('next', $this->branch('missing.plg', 'ostree-booted', ['no-branch.json', 'etc-os-update.json']), 'Config without a branch key falls through');

        $this->write('non-string.json', json_encode(['branch' => ['preview']]));
        $this->assertSame('next', $this->branch('missing.plg', 'ostree-booted', ['non-string.json', 'etc-os-update.json']), 'Non-string branch falls through');

        foreach (['Stable', '../etc', '-next', 'a b', str_repeat('a', 33), ''] as $bad) {
            $this->write('bad.json', json_encode(['branch' => $bad]));
            $this->assertSame('stable', $this->branch('missing.plg', 'ostree-booted', ['bad.json']), 'Invalid branch ' . var_export($bad, true) . ' defaults to stable');
        }

        $this->write('trimmed.json', json_encode(['branch' => " preview \n"]));
        $this->assertSame('preview', $this->branch('missing.plg', 'ostree-booted', ['trimmed.json']), 'Branch value is trimmed');

        $this->write('long.json', json_encode(['branch' => 'a' . str_repeat('b', 31)]));
        $this->assertSame('a' . str_repeat('b', 31), $this->branch('missing.plg', 'ostree-booted', ['long.json']), 'Branch of 32 characters is accepted');

        $this->write('unraid-version', "version=\"8.0.0-preview.3\"\n");
        $this->assertSame('8.0.0-preview.3', OsRelease::version($this->path('unraid-version')), 'Version is read from /etc/unraid-version');
        $this->assertSame(null, OsRelease::version($this->path('missing-version')), 'Missing version file yields null');
        $this->write('empty-version', "name=\"Unraid\"\n");
        $this->assertSame(null, OsRelease::version($this->path('empty-version')), 'Version file without version yields null');
    }

    private function cleanup($dir) {
        foreach (glob($dir . '/*') ?: [] as $file) {
            unlink($file);
        }
        rmdir($dir);
    }
}

exit((new OsReleaseTest())->run());
