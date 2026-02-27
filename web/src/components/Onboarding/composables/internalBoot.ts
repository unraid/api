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
    },
    body: payload.toString(),
  });

  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as {
      ok?: boolean;
      code?: number;
      output?: string;
    };
    return {
      ok: Boolean(parsed.ok),
      code: parsed.code,
      output: parsed.output ?? raw,
    };
  } catch {
    return {
      ok: false,
      output: raw || `mkbootpool request failed (${response.status})`,
    };
  }
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
