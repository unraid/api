<?php
/**
 * This file exists to maintain separation of concerns between UnraidCheck and ReplaceKey.
 * Instead of combining both classes directly, we utilize the unraidcheck script which already
 * handles both operations in a simplified manner.
 * 
 * It's called via the WebguiCheckForUpdate function in composables/services/webgui.ts of the web components.
 * Handles WebguiUnraidCheckExecPayload interface parameters:
 * - altUrl?: string
 * - json?: boolean
 */
class UnraidCheckExec
{
    private const SCRIPT_PATH = '/usr/local/emhttp/plugins/dynamix.plugin.manager/scripts/unraidcheck';

    private function setupEnvironment(): void
    {
        header('Content-Type: application/json');

        $params = [
            'json' => 'true',
        ];
        // allows the web components to determine the OS_RELEASES url
        if (isset($_GET['altUrl']) && filter_var($_GET['altUrl'], FILTER_VALIDATE_URL)) {
            $params['altUrl'] = $_GET['altUrl'];
        }
        // pass the params to the unraidcheck script for usage in UnraidCheck.php
        putenv('QUERY_STRING=' . http_build_query($params));
    }

    public function execute(): string
    {
        $this->setupEnvironment();
        $output = [];
        exec(self::SCRIPT_PATH, $output);
        return implode("\n", $output);
    }
}

// Usage
$checker = new UnraidCheckExec();
echo $checker->execute();
