import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

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
