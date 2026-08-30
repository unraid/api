<?php
$docroot = $docroot ?? $_SERVER['DOCUMENT_ROOT'] ?: '/usr/local/emhttp';
require_once "$docroot/plugins/dynamix.my.servers/include/api-config.php";

/**
 * Wrapper around the API's connect.json configuration file.
 */
class ConnectConfig
{
    public static function configPath()
    {
        if (file_exists('/boot/config/preview/enabled')) {
            return '/boot/config/preview/plugins/dynamix.my.servers/configs/connect.json';
        }

        return ApiConfig::CONFIG_DIR . '/connect.json';
    }

    public static function getConfig()
    {
        try {
            return json_decode(file_get_contents(self::configPath()), true) ?? [];
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
