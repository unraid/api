export interface PortConflictContainer {
  id: string;
  name: string;
}

export interface LanPortConflict {
  lanIpPort: string;
  publicPort?: number | null;
  type: string;
  containers: PortConflictContainer[];
}

export interface ContainerPortConflict {
  privatePort: number;
  type: string;
  containers: PortConflictContainer[];
}

export interface DockerPortConflictsResult {
  lanPorts: LanPortConflict[];
  containerPorts: ContainerPortConflict[];
}
