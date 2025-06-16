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
     * Check if a specific API plugin is enabled
     * @param string $pluginName The name of the plugin to check
     * @return bool True if plugin is enabled, false otherwise
     */
    public static function isApiPluginEnabled($pluginName)
    {
        $apiUtilsScript = self::getApiUtilsScript();
        $result = @exec("$apiUtilsScript is_api_plugin_enabled $pluginName 2>/dev/null; echo $?");
        return $result === '0';
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
        return trim(@exec("$apiUtilsScript get_api_version 2>/dev/null")) ?: 'unknown';
    }
}
