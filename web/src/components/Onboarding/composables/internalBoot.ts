export interface InternalBootDeviceOption {
  value: string;
  label: string;
  sizeMiB: number | null;
}

export interface InternalBootTemplateData {
  isBootPoolUiAvailable: boolean;
  isBootPoolEligible: boolean;
  poolNameDefault: string;
  slotOptions: number[];
  deviceOptions: InternalBootDeviceOption[];
  bootSizePresetsMiB: number[];
  defaultBootSizeMiB: number;
  defaultUpdateBios: boolean;
}

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

const DEFAULT_BOOT_SIZE_MIB = 16384;

const parseInteger = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePositiveInteger = (value: string | null | undefined): number | null => {
  const parsed = parseInteger(value);
  if (parsed === null || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseTemplateData = (html: string): InternalBootTemplateData => {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, 'text/html');
  const templateRoot = documentNode.querySelector('#templatePopupBootPool');

  if (!templateRoot) {
    return {
      isBootPoolUiAvailable: false,
      isBootPoolEligible: false,
      poolNameDefault: 'cache',
      slotOptions: [1, 2],
      deviceOptions: [],
      bootSizePresetsMiB: [16384, 32768, 65536, 131072],
      defaultBootSizeMiB: DEFAULT_BOOT_SIZE_MIB,
      defaultUpdateBios: true,
    };
  }

  const slotOptions = Array.from(templateRoot.querySelectorAll('select[name="poolSlots"] option'))
    .map((option) => parsePositiveInteger(option.getAttribute('value')))
    .filter((value): value is number => value !== null);

  const deviceOptions = Array.from(
    templateRoot.querySelectorAll('#bootPoolDevicesSource select option')
  )
    .map((option) => {
      const value = option.getAttribute('value')?.trim() ?? '';
      if (!value) {
        return null;
      }
      return {
        value,
        label: option.textContent?.trim() ?? value,
        sizeMiB: parsePositiveInteger(option.getAttribute('data-size-mib')),
      };
    })
    .filter((option): option is InternalBootDeviceOption => option !== null);

  const bootSizePresetsMiB = Array.from(
    templateRoot.querySelectorAll('select[name="poolBootSizePreset"] option')
  )
    .map((option) => parseInteger(option.getAttribute('value')))
    .filter((value): value is number => value !== null && value >= 0);

  const defaultBootSizeMiB =
    parsePositiveInteger(
      templateRoot.querySelector('input[name="poolBootSize"]')?.getAttribute('value')
    ) ?? bootSizePresetsMiB[0] ?? DEFAULT_BOOT_SIZE_MIB;

  const poolNameDefault =
    templateRoot.querySelector<HTMLInputElement>('input[name="poolName"]')?.value?.trim() || 'cache';
  const defaultUpdateBios = Boolean(
    templateRoot.querySelector<HTMLInputElement>('input[name="poolUpdateBios"]')?.checked
  );
  const isBootPoolEligible = Boolean(
    documentNode.querySelector('input[onclick="addBootPoolPopup()"]')
  );

  return {
    isBootPoolUiAvailable: true,
    isBootPoolEligible,
    poolNameDefault,
    slotOptions: slotOptions.length > 0 ? slotOptions : [1, 2],
    deviceOptions,
    bootSizePresetsMiB:
      bootSizePresetsMiB.length > 0 ? bootSizePresetsMiB : [16384, 32768, 65536, 131072],
    defaultBootSizeMiB,
    defaultUpdateBios,
  };
};

export const fetchInternalBootTemplateData = async (): Promise<InternalBootTemplateData> => {
  const response = await fetch('/Main/PoolDevices', {
    credentials: 'same-origin',
  });
  if (!response.ok) {
    throw new Error(`Failed to load pool devices page (${response.status})`);
  }

  const html = await response.text();
  return parseTemplateData(html);
};

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
