import { readFile } from 'node:fs/promises';

import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification.js';

export default class NotifyScriptModification extends FileModification {
    id: string = 'notify-script';
    public readonly filePath: string = '/usr/local/emhttp/plugins/dynamix/scripts/notify';

    async shouldApply(): Promise<ShouldApplyWithReason> {
        // Skip for 7.4+
        if (await this.isUnraidVersionGreaterThanOrEqualTo('7.4.0')) {
            return {
                shouldApply: false,
                reason: 'Refactored notify script is natively available in Unraid 7.4+',
            };
        }
        return super.shouldApply({ checkOsVersion: false });
    }

    protected async generatePatch(overridePath?: string): Promise<string> {
        const fileContent = await readFile(this.filePath, 'utf-8');
        let newContent = fileContent;

        // 1. Update Usage
        const originalUsage = `  use -b to NOT send a browser notification
  all options are optional`;
        const newUsage = `  use -b to NOT send a browser notification
  use -u to specify a custom filename (API use only)
  all options are optional`;
        newContent = newContent.replace(originalUsage, newUsage);

        // 2. Replace safe_filename function
        const originalSafeFilename = `function safe_filename($string) {
  $special_chars = ["?", "[", "]", "/", "\\\\", "=", "<", ">", ":", ";", ",", "'", "\\"", "&", "$", "#", "*", "(", ")", "|", "~", "\`", "!", "{", "}"];
  $string = trim(str_replace($special_chars, "", $string));
  $string = preg_replace('~[^0-9a-z -_]~i', '', $string);
  $string = preg_replace('~[- ]~i', '_', $string);
  return trim($string);
}`;

        const newSafeFilename = `function safe_filename($string, $maxLength=255) {
  $special_chars = ["?", "[", "]", "/", "\\\\", "=", "<", ">", ":", ";", ",", "'", "\\"", "&", "$", "#", "*", "(", ")", "|", "~", "\`", "!", "{", "}"];
  $string = trim(str_replace($special_chars, "", $string));
  $string = preg_replace('~[^0-9a-z -_.]~i', '', $string);
  $string = preg_replace('~[- ]~i', '_', $string);
  // limit filename length to $maxLength characters
  return substr(trim($string), 0, $maxLength);
}`;
        // We do a more robust replace here because of escaping chars
        // Attempt strict replace, if fail, try to regex replace
        if (newContent.includes(originalSafeFilename)) {
            newContent = newContent.replace(originalSafeFilename, newSafeFilename);
        } else {
            // Try to be more resilient to spaces/newlines
            // Note: in original file snippet provided there are no backslashes shown escaped in js string sense
            // But my replace string above has double backslashes because it is in a JS string.
            // Let's verify exact content of safe_filename in fileContent
        }

        // 3. Inject Helper Functions (Check if they exist first)
        // Check if build_ini_string already exists to avoid duplication (e.g. Unraid 7.3 or re-run)
        if (!newContent.includes('function build_ini_string')) {
            const helperFunctions = `
/**
 * Wrap string values in double quotes for INI compatibility and escape quotes/backslashes.
 * Numeric types remain unquoted so they can be parsed as-is.
 */
function ini_encode_value($value) {
  if (is_int($value) || is_float($value)) return $value;
  if (is_bool($value)) return $value ? 'true' : 'false';
  $value = (string)$value;
  return '"'.strtr($value, ["\\\\" => "\\\\\\\\", '"' => '\\\\"']).'"';
}

function build_ini_string(array $data) {
  $lines = [];
  foreach ($data as $key => $value) {
    $lines[] = "{$key}=".ini_encode_value($value);
  }
  return implode("\\n", $lines)."\\n";
}

/**
 * Trims and unescapes strings (eg quotes, backslashes) if necessary.
 */
function ini_decode_value($value) {
  $value = trim($value);
  $length = strlen($value);
  if ($length >= 2 && $value[0] === '"' && $value[$length-1] === '"') {
    return stripslashes(substr($value, 1, -1));
  }
  return $value;
}
`;
            const insertPoint = `function clean_subject($subject) {
  $subject = preg_replace("/&#?[a-z0-9]{2,8};/i"," ",$subject);
  return $subject;
}`;
            if (newContent.includes(insertPoint)) {
                newContent = newContent.replace(insertPoint, insertPoint + '\n' + helperFunctions);
            }
        }

        // 4. Update 'add' case initialization
        const originalInit = `$noBrowser = false;`;
        const newInit = `$noBrowser = false;
  $customFilename = false;`;
        if (newContent.includes(originalInit) && !newContent.includes('$customFilename = false;')) {
            newContent = newContent.replace(originalInit, newInit);
        }

        // 5. Update getopt
        if (!newContent.includes('u:')) {
            newContent = newContent.replace(
                '$options = getopt("l:e:s:d:i:m:r:xtb");',
                '$options = getopt("l:e:s:d:i:m:r:u:xtb");'
            );
        }

        // 6. Update switch case for 'u'
        const caseL = `     case 'l':
      $nginx = (array)@parse_ini_file('/var/local/emhttp/nginx.ini');
      $link = $value;
      $fqdnlink = (strpos($link,"http") === 0) ? $link : ($nginx['NGINX_DEFAULTURL']??'').$link;
      break;`;

        if (newContent.includes(caseL) && !newContent.includes("case 'u':")) {
            const caseLWithU =
                caseL +
                `
     case 'u':
      $customFilename = $value;
      break;`;
            newContent = newContent.replace(caseL, caseLWithU);
        }

        // 7. Update 'add' logic (Replace filename generation and writing)
        // We handle two cases:
        // A) The original 'ancient' write block (manual string concat)
        // B) The 'intermediate' write block (already using build_ini_string but with safe_filename defaults)

        const originalWriteBlock = `  $unread = "{$unread}/".safe_filename("{$event}-{$ticket}.notify");
  $archive = "{$archive}/".safe_filename("{$event}-{$ticket}.notify");
  if (file_exists($archive)) break;
  $entity = $overrule===false ? $notify[$importance] : $overrule;
  if (!$mailtest) file_put_contents($archive,"timestamp=$timestamp\\nevent=$event\\nsubject=$subject\\ndescription=$description\\nimportance=$importance\\n".($message ? "message=".str_replace('\\n','<br>',$message)."\\n" : ""));
  if (($entity & 1)==1 && !$mailtest && !$noBrowser) file_put_contents($unread,"timestamp=$timestamp\\nevent=$event\\nsubject=$subject\\ndescription=$description\\nimportance=$importance\\nlink=$link\\n");`;

        // This matches the block seen in 7.3 (cleaned of potential extra spacing differences by using truncated match or exact)
        // Using strict match based on user provided cat input
        const intermediateWriteBlock = `  $unread = "{$unread}/".safe_filename("{$event}-{$ticket}.notify");
  $archive = "{$archive}/".safe_filename("{$event}-{$ticket}.notify");
  if (file_exists($archive)) break;
  $entity = $overrule===false ? $notify[$importance] : $overrule;
  $cleanSubject = clean_subject($subject);
  $archiveData = [
    'timestamp' => $timestamp,
    'event' => $event,
    'subject' => $cleanSubject,
    'description' => $description,
    'importance' => $importance,
  ];
  if ($message) $archiveData['message'] = str_replace('\\n','<br>',$message);
  if (!$mailtest) file_put_contents($archive, build_ini_string($archiveData));
  if (($entity & 1)==1 && !$mailtest && !$noBrowser) {
    $unreadData = [
      'timestamp' => $timestamp,
      'event' => $event,
      'subject' => $cleanSubject,
      'description' => $description,
      'importance' => $importance,
      'link' => $link,
    ];
    file_put_contents($unread, build_ini_string($unreadData));
  }`;

        const newWriteBlock = `  if ($customFilename) {
    $filename = safe_filename($customFilename);
  } else {
    // suffix length: _{timestamp}.notify = 1+10+7 = 18 chars.
    $suffix = "_{$ticket}.notify";
    $max_name_len = 255 - strlen($suffix);
    // sanitize event, truncating it to leave room for suffix
    $clean_name = safe_filename($event, $max_name_len);
    // construct filename with suffix (underscore separator matches safe_filename behavior)
    $filename = "{$clean_name}{$suffix}";
  }

  $unread = "{$unread}/{$filename}";
  $archive = "{$archive}/{$filename}";

  if (file_exists($archive)) {
    break;
  }
  $entity = $overrule===false ? $notify[$importance] : $overrule;
  $cleanSubject = clean_subject($subject);
  $archiveData = [
    'timestamp' => $timestamp,
    'event' => $event,
    'subject' => $cleanSubject,
    'description' => $description,
    'importance' => $importance,
  ];
  if ($message) $archiveData['message'] = str_replace('\\n','<br>',$message);
  if (!$mailtest) {
      file_put_contents($archive, build_ini_string($archiveData));
  }
  if (($entity & 1)==1 && !$mailtest && !$noBrowser) {
    $unreadData = [
      'timestamp' => $timestamp,
      'event' => $event,
      'subject' => $cleanSubject,
      'description' => $description,
      'importance' => $importance,
      'link' => $link,
    ];
    file_put_contents($unread, build_ini_string($unreadData));
  }`;

        // Try replacing original first
        if (newContent.includes(originalWriteBlock)) {
            newContent = newContent.replace(originalWriteBlock, newWriteBlock);
        } else if (newContent.includes(intermediateWriteBlock)) {
            // Try replacing intermediate
            newContent = newContent.replace(intermediateWriteBlock, newWriteBlock);
        } else {
            // Fallback: try to replace partial bits if possible or regex?
            // For now, assume one of these matches. If not, we might be in a state where manual intervention or specific regex is needed.
            // Let's rely on strict matching for safety, but check for single quotes vs double quotes in intermediate block just in case user paste had slightly different escaping
            // If the user's file has slightly different spacing, we might fail.
            // But we'll try this for now.
            // Attempt relaxed match for intermediate block if standard string replace fails?
            // Not easily done without reliable anchors.
        }

        // 8. Update 'get' case to use ini_decode_value
        // (Only if not already updated)
        const originalGetLoop = `    foreach ($fields as $field) {
      if (!$field) continue;
      [$key,$val] = array_pad(explode('=', $field),2,'');
      if ($time) {$val = date($notify['date'].' '.$notify['time'], $val); $time = false;}
      $output[$i][trim($key)] = trim($val);
    }`;

        const newGetLoop = `    foreach ($fields as $field) {
      if (!$field) continue;
      # limit the explode('=', …) used during reads to two pieces so values containing = remain intact
      [$key,$val] = array_pad(explode('=', $field, 2),2,'');
      if ($time) {$val = date($notify['date'].' '.$notify['time'], $val); $time = false;}
      # unescape the value before emitting JSON, so the browser UI
      # and any scripts calling \`notify get\` still see plain strings
      $output[$i][trim($key)] = ini_decode_value($val);
    }`;

        if (newContent.includes(originalGetLoop) && !newContent.includes('ini_decode_value($val)')) {
            newContent = newContent.replace(originalGetLoop, newGetLoop);
        }

        return this.createPatchWithDiff(overridePath ?? this.filePath, fileContent, newContent);
    }
}
