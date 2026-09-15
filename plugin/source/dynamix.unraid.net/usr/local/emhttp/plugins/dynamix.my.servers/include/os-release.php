<?php
/* Copyright 2005-2026, Lime Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

/**
 * Resolves the installed Unraid OS release branch and version.
 *
 * Unraid 7 derives the branch from the CATEGORY of the installed OS plugin
 * (unRAIDServer.plg). Unraid OS 8 (OSTree hosts) has no OS plugin; Core records
 * the branch of the installed release in /boot/config/os-update.json, with the
 * image default in /etc/unraid/os-update.json as a read-only fallback.
 */
class OsRelease
{
    public const DEFAULT_BRANCH = 'stable';
    public const BRANCH_PATTERN = '/^[a-z0-9][a-z0-9_-]{0,31}$/';
    public const PLG_PATHS = [
        '/usr/local/emhttp/plugins/unRAIDServer/unRAIDServer.plg',
        '/var/log/plugins/unRAIDServer.plg',
    ];
    public const OSTREE_BOOTED_PATH = '/run/ostree-booted';
    public const OS_UPDATE_CONFIG_PATHS = [
        '/boot/config/os-update.json',
        '/etc/unraid/os-update.json',
    ];
    public const UNRAID_VERSION_PATH = '/etc/unraid-version';

    /**
     * @param string[]|null $plgPaths
     * @param string[]|null $osUpdateConfigPaths
     */
    public static function branch(?array $plgPaths = null, ?string $ostreeBootedPath = null, ?array $osUpdateConfigPaths = null): string
    {
        $branch = null;
        $plgPath = self::firstFile($plgPaths ?? self::PLG_PATHS);
        if ($plgPath !== null) {
            $branch = self::branchFromPlugin($plgPath);
        } elseif (is_file($ostreeBootedPath ?? self::OSTREE_BOOTED_PATH)) {
            $branch = self::branchFromOsUpdateConfig($osUpdateConfigPaths ?? self::OS_UPDATE_CONFIG_PATHS);
        }
        return self::isValidBranch($branch) ? $branch : self::DEFAULT_BRANCH;
    }

    /**
     * Installed OS version from /etc/unraid-version, or null when unavailable.
     */
    public static function version(?string $unraidVersionPath = null): ?string
    {
        $path = $unraidVersionPath ?? self::UNRAID_VERSION_PATH;
        if (!is_file($path)) {
            return null;
        }
        $info = @parse_ini_file($path);
        $version = is_array($info) ? ($info['version'] ?? null) : null;
        $version = is_string($version) ? trim($version) : '';
        return $version === '' ? null : $version;
    }

    public static function isValidBranch($branch): bool
    {
        return is_string($branch) && preg_match(self::BRANCH_PATTERN, $branch) === 1;
    }

    private static function firstFile(array $paths): ?string
    {
        foreach ($paths as $path) {
            if (is_file($path)) {
                return $path;
            }
        }
        return null;
    }

    private static function branchFromPlugin(string $plgPath): ?string
    {
        if (function_exists('plugin')) {
            $branch = plugin('category', $plgPath);
        } else {
            $branch = @exec('plugin category ' . escapeshellarg($plgPath));
        }
        return is_string($branch) ? trim($branch) : null;
    }

    private static function branchFromOsUpdateConfig(array $paths): ?string
    {
        foreach ($paths as $path) {
            if (!is_file($path)) {
                continue;
            }
            $config = json_decode((string)@file_get_contents($path), true);
            if (!is_array($config)) {
                continue;
            }
            $branch = $config['branch'] ?? null;
            if (is_string($branch)) {
                return trim($branch);
            }
        }
        return null;
    }
}
