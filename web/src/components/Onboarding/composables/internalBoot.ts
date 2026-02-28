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

const readCsrfToken = (): string | null => {
  const token = globalThis.csrf_token;
  if (typeof token !== 'string') {
    return null;
  }
  const trimmedToken = token.trim();
  return trimmedToken.length > 0 ? trimmedToken : null;
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
  const csrfToken = readCsrfToken();
  if (csrfToken) {
    payload.append('csrf_token', csrfToken);
  }

  const response = await fetch('/plugins/dynamix/include/mkbootpool.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
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

  return {
    ok: false,
    output: `mkbootpool returned an empty response (HTTP ${response.status}). Check /boot/config/internal_boot/output.log via server shell for script output.`,
  };
};

export const submitInternalBootReboot = () => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/plugins/dynamix/include/Boot.php';
  form.target = '_top';
  form.style.display = 'none';

  const cmd = document.createElement('input');
  cmd.type = 'hidden';
  cmd.name = 'cmd';
  cmd.value = 'reboot';
  form.appendChild(cmd);

  const csrfToken = readCsrfToken();
  if (csrfToken) {
    const csrf = document.createElement('input');
    csrf.type = 'hidden';
    csrf.name = 'csrf_token';
    csrf.value = csrfToken;
    form.appendChild(csrf);
  }

  document.body.appendChild(form);
  form.submit();
};
