import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { UPSConfigInput } from './ups.inputs';

const execPromise = promisify(exec);

const UPSSchema = z.object({
  MODEL: z.string().optional(),
  STATUS: z.string().optional(),
  BCHARGE: z.string().optional(),
  TIMELEFT: z.string().optional(),
  LINEV: z.string().optional(),
  OUTPUTV: z.string().optional(),
  LOADPCT: z.string().optional(),
});

export type UPSData = z.infer<typeof UPSSchema>;

@Injectable()
export class UPSService {
  async getUPSData(): Promise<UPSData> {
    try {
      const { stdout } = await execPromise('/sbin/apcaccess 2>/dev/null');
      const parsedData = this.parseUPSData(stdout);
      return UPSSchema.parse(parsedData);
    } catch (error) {
      console.error('Error getting UPS data:', error);
      throw new Error('Failed to get UPS data');
    }
  }

  async configureUPS(config: UPSConfigInput): Promise<void> {
    const conf = '/etc/apcupsd/apcupsd.conf';
    const cable = config.UPSCABLE === 'custom' ? config.CUSTOMUPSCABLE : config.UPSCABLE;

    await execPromise('/etc/rc.d/rc.apcupsd stop');
    await execPromise(`sed -i -e '/^NISIP/c\\NISIP 0.0.0.0' ${conf}`);
    await execPromise(`sed -i -e '/^UPSTYPE/c\\UPSTYPE "${config.UPSTYPE}"' ${conf}`);
    await execPromise(`sed -i -e '/^DEVICE/c\\DEVICE "${config.DEVICE}"' ${conf}`);
    await execPromise(`sed -i -e '/^BATTERYLEVEL/c\\BATTERYLEVEL "${config.BATTERYLEVEL}"' ${conf}`);
    await execPromise(`sed -i -e '/^MINUTES/c\\MINUTES "${config.MINUTES}"' ${conf}`);
    await execPromise(`sed -i -e '/^TIMEOUT/c\\TIMEOUT "${config.TIMEOUT}"' ${conf}`);
    await execPromise(`sed -i -e '/^UPSCABLE/c\\UPSCABLE "${cable}"' ${conf}`);

    if (config.KILLUPS === 'yes' && config.SERVICE === 'enable') {
      await execPromise(`! grep -q apccontrol /etc/rc.d/rc.6 && sed -i -e 's:/sbin/poweroff:/etc/apcupsd/apccontrol killpower; /sbin/poweroff:' /etc/rc.d/rc.6`);
    } else {
      await execPromise(`grep -q apccontrol /etc/rc.d/rc.6 && sed -i -e 's:/etc/apcupsd/apccontrol killpower; /sbin/poweroff:/sbin/poweroff:' /etc/rc.d/rc.6`);
    }

    if (config.SERVICE === 'enable') {
      await execPromise('/etc/rc.d/rc.apcupsd start');
    }
  }

  private parseUPSData(data: string): any {
    const lines = data.split('\n');
    const upsData = {};
    for (const line of lines) {
      const [key, value] = line.split(': ');
      if (key && value) {
        upsData[key.trim()] = value.trim();
      }
    }
    return upsData;
  }
}
