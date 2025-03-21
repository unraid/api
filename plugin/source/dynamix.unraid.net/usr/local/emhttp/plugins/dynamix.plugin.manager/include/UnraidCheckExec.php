<?php
/**
 * This file exists to maintain separation of concerns between UnraidCheck and ReplaceKey.
 * Instead of combining both classes directly, we utilize the unraidcheck script which already
 * handles both operations in a simplified manner.
 * 
 * It's called via the WebguiCheckForUpdate function in composables/services/webgui.ts of the web components.
 */
class UnraidCheckExec
{
    private const SCRIPT_PATH = '/usr/local/emhttp/plugins/dynamix.plugin.manager/scripts/unraidcheck';

    private function setupEnvironment(): void
    {
        header('Content-Type: application/json');
        putenv('QUERY_STRING=json=true');
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
