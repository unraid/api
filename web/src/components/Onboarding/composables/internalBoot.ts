export interface InternalBootSelection {
  poolName: string;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
}

export interface SubmitInternalBootOptions {
  reboot?: boolean;
}

export interface InternalBootSubmitResult {
  ok: boolean;
  code?: number;
  output: string;
}

interface MkbootpoolResponsePayload {
  ok?: boolean;
  code?: number;
  output?: string;
}

const buildInternalBootArgs = (
  selection: InternalBootSelection,
  options: SubmitInternalBootOptions
): string[] => {
  const args = [selection.poolName, String(selection.bootSizeMiB), ...selection.devices];
  if (selection.updateBios) {
    args.push('updatebios');
  }
  if (options.reboot) {
    args.push('reboot');
  }
  args.push('update');
  return args;
};

const parseMkbootpoolPayload = (raw: string): MkbootpoolResponsePayload | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as MkbootpoolResponsePayload;
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as MkbootpoolResponsePayload;
    } catch {
      return null;
    }
  }
};

const readInternalBootOutputLog = async (): Promise<string | null> => {
  try {
    const logResponse = await fetch('/boot/config/internal_boot/output.log', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!logResponse.ok) {
      return null;
    }
    const logBody = (await logResponse.text()).trim();
    return logBody.length > 0 ? logBody : null;
  } catch {
    return null;
  }
};

export const submitInternalBootCreation = async (
  selection: InternalBootSelection,
  options: SubmitInternalBootOptions = {}
): Promise<InternalBootSubmitResult> => {
  const payload = new URLSearchParams();
  const args = buildInternalBootArgs(selection, options);
  for (const arg of args) {
    payload.append('args[]', arg);
  }

  const response = await fetch('/plugins/dynamix/include/mkbootpool.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: payload.toString(),
  });

  const raw = await response.text();
  const trimmedRaw = raw.trim();
  const parsed = parseMkbootpoolPayload(raw);

  if (parsed) {
    const parsedOutput = parsed.output?.trim() ?? '';
    return {
      ok: Boolean(parsed.ok),
      code: parsed.code,
      output: parsedOutput.length > 0 ? parsedOutput : trimmedRaw || 'No output',
    };
  }
  if (trimmedRaw.length > 0) {
    return {
      ok: false,
      output: trimmedRaw,
    };
  }

  const logOutput = await readInternalBootOutputLog();
  if (logOutput) {
    return {
      ok: false,
      output: `mkbootpool returned an empty response (HTTP ${response.status}). Latest output.log:\n${logOutput}`,
    };
  }

  return {
    ok: false,
    output: `mkbootpool returned an empty response (HTTP ${response.status}, redirected=${String(response.redirected)}, url=${response.url}, content-type=${response.headers.get('content-type') ?? 'unknown'})`,
  };
};

export const submitInternalBootReboot = () => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/webGui/include/Boot.php';
  form.className = 'hidden';

  const cmd = document.createElement('input');
  cmd.type = 'hidden';
  cmd.name = 'cmd';
  cmd.value = 'reboot';
  form.appendChild(cmd);

  document.body.appendChild(form);
  form.submit();
};
