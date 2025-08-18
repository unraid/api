import { Injectable, Scope } from '@nestjs/common';

import { currentLoad, Systeminformation } from 'systeminformation';

@Injectable({ scope: Scope.REQUEST })
export class CpuDataService {
    private cpuLoadData: Promise<Systeminformation.CurrentLoadData>;

    public getCpuLoad(): Promise<Systeminformation.CurrentLoadData> {
        if (!this.cpuLoadData) {
            this.cpuLoadData = currentLoad();
        }
        return this.cpuLoadData;
    }
}
