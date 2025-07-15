<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';
require_once "$docroot/plugins/dynamix.my.servers/include/api-config.php";

/**
 * Wrapper around the API's connect.json configuration file.
 */
class ConnectConfig
{
    public const CONFIG_PATH = ApiConfig::CONFIG_DIR . '/connect.json';

    public static function getConfig()
    {
        try {
            return json_decode(file_get_contents(self::CONFIG_PATH), true) ?? [];
        } catch (Throwable $e) {
            return [];
        }
    }

    public static function isUserSignedIn()
    {
        $config = self::getConfig();
        return ApiConfig::isConnectPluginEnabled() && !empty($config['username'] ?? '');
    }
}
