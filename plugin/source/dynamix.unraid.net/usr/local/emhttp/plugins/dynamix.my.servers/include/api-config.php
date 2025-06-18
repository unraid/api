<?php

/**
 * API Configuration utilities
 * Centralized functions for checking API plugin status
 */
class ApiConfig
{
    private static $scriptsDir = "/usr/local/share/dynamix.unraid.net/scripts";

    /**
     * Get the path to api_utils.sh script
     * @return string
     */
    private static function getApiUtilsScript()
    {
        return self::$scriptsDir . "/api_utils.sh";
    }

    /**
     * Execute a command safely with proper error handling
     * @param string $command The command to execute
     * @param int &$exitCode Reference to store the exit code
     * @return string The command output
     */
    private static function executeCommand($command, &$exitCode = null)
    {
        $output = [];
        $exitCode = 0;
        
        exec($command, $output, $exitCode);
        
        return implode("\n", $output);
    }

    /**
     * Check if a specific API plugin is enabled
     * @param string $pluginName The name of the plugin to check
     * @return bool True if plugin is enabled, false otherwise
     */
    public static function isApiPluginEnabled($pluginName)
    {
        if (empty($pluginName) || !is_string($pluginName)) {
            return false;
        }

        $apiUtilsScript = self::getApiUtilsScript();
        
        if (!is_executable($apiUtilsScript)) {
            return false;
        }

        $escapedScript = escapeshellarg($apiUtilsScript);
        $escapedPlugin = escapeshellarg($pluginName);
        $command = "$escapedScript is_api_plugin_enabled $escapedPlugin 2>/dev/null";
        
        $exitCode = 0;
        self::executeCommand($command, $exitCode);
        
        return $exitCode === 0;
    }

    /**
     * Check if the unraid-api-plugin-connect is enabled
     * @return bool True if connect plugin is enabled, false otherwise
     */
    public static function isConnectPluginEnabled()
    {
        return self::isApiPluginEnabled('unraid-api-plugin-connect');
    }

    /**
     * Get API version from api_utils.sh
     * @return string The API version or 'unknown' if not found
     */
    public static function getApiVersion()
    {
        $apiUtilsScript = self::getApiUtilsScript();
        
        if (!is_executable($apiUtilsScript)) {
            return 'unknown';
        }

        $escapedScript = escapeshellarg($apiUtilsScript);
        $command = "$escapedScript get_api_version 2>/dev/null";
        
        $exitCode = 0;
        $output = self::executeCommand($command, $exitCode);
        
        if ($exitCode !== 0) {
            return 'unknown';
        }
        
        $version = trim($output);
        return !empty($version) ? $version : 'unknown';
    }
}
