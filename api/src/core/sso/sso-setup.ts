import { existsSync } from 'node:fs';
import { copyFile, readFile, rename, unlink, writeFile } from 'node:fs/promises';





export const setupSso = async () => {
    const path = '/usr/local/emhttp/plugins/dynamix/include/.login.php';

    // Define the new PHP function to insert
    const newFunction = `
function verifyUsernamePasswordAndSSO(string $username, string $password): bool {
    if ($username != "root") return false;

    $output = exec("/usr/bin/getent shadow $username");
    if ($output === false) return false;
    $credentials = explode(":", $output);
    $valid = password_verify($password, $credentials[1]);
    if ($valid) {
        return true;
    }
    // We may have an SSO token, attempt validation
    if (strlen($password) > 800) {
        $safePassword = escapeshellarg($password);
        if (!preg_match('/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/', $password)) {
            my_logger("SSO Login Attempt Failed: Invalid token format");
        }
        $response = exec("/usr/local/bin/unraid-api sso validate-token $safePassword", $output, $code);
        my_logger("SSO Login Attempt: $response");
        if ($code === 0 && $response && strpos($response, '"valid":true') !== false) {
            return true;
        }
    }
    return false;
}`;

    const tagToInject = '<?php include "$docroot/plugins/dynamix.my.servers/include/sso-login.php"; ?>';

    // Backup the original file if exists
    if (existsSync(path + '.bak')) {
        await copyFile(path + '.bak', path);
        await unlink(path + '.bak');
    }

    // Read the file content
    let fileContent = await readFile(path, 'utf-8');

    // Backup the original content
    await writeFile(path + '.bak', fileContent);

    // Add new function after the opening PHP tag (<?php)
    fileContent = fileContent.replace(/<\?php\s*(\r?\n|\r)*/, `<?php\n\n${newFunction}\n`);

    // Replace the old function call with the new function name
    const functionCallPattern = /!verifyUsernamePassword\(\$username, \$password\)/g;
    fileContent = fileContent.replace(
        functionCallPattern,
        '!verifyUsernamePasswordAndSSO($username, $password)'
    );

    // Inject the PHP include tag after the closing </form> tag
    fileContent = fileContent.replace(/<\/form>/i, `</form>\n${tagToInject}`);

    // Write the updated content back to the file
    await writeFile(path, fileContent);

    console.log('Function replaced successfully.');
};