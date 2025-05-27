<Climb>
  <header>
    <id>m9X4</id>
    <type>feature</type>
    <description>Add preprocessing capabilities to backup jobs for ZFS pools, flash backups, Docker containers, and custom scripts</description>
  </header>
  <newDependencies>None - will use existing system commands and utilities</newDependencies>
  <prerequisiteChanges>None - extends existing backup system</prerequisiteChanges>
  <relevantFiles>
    - api/src/unraid-api/graph/resolvers/backup/backup-config.service.ts (main service)
    - api/src/unraid-api/graph/resolvers/backup/backup.model.ts (GraphQL models)
    - plugin/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/UpdateFlashBackup.php (flash backup reference)
    - web/components/Backup/ (UI components)
  </relevantFiles>
  <everythingElse>

## Feature Overview

**Feature Name**: Backup Job Preprocessing System
**Purpose**: Enable backup jobs to run preprocessing steps before the actual backup operation, supporting specialized backup scenarios like ZFS snapshots, flash drive backups, Docker container management, and custom user scripts.

**Problem Being Solved**: 
- Current backup system only supports direct file/folder backups via rclone
- ZFS pools need snapshot creation before backup
- Flash drive backups require git repository compression
- Users need ability to run custom preparation scripts

**Success Metrics**:
- Backup jobs can successfully execute preprocessing steps
- ZFS snapshot backups work reliably
- Flash backup integration functions correctly
- Docker container backup workflows complete without data corruption
- Custom scripts execute safely in isolated environments

## Requirements

### Functional Requirements

**Core Preprocessing Types**:
1. **ZFS Snapshot**: Create ZFS snapshot, stream snapshot data directly to destination
2. **Flash Backup**: Compress git repository from /boot/.git and stream directly to destination
3. **Custom Script**: Execute user-provided script for custom preprocessing (non-streaming)
4. **None**: Direct backup (current behavior)

**Preprocessing Workflow**:
1. Execute preprocessing step
2. For streaming operations: pipe data directly to rclone daemon via rcat
3. For non-streaming operations: update sourcePath to preprocessed location
4. Execute cleanup/postprocessing if required
5. Log all steps and handle errors gracefully

**Configuration Options**:
- Preprocessing type selection
- Type-specific parameters (ZFS pool name, Docker container name, script path)
- Streaming vs file-based backup mode
- Timeout settings for preprocessing steps
- Cleanup behavior configuration

### Technical Requirements

**Performance**: Preprocessing should complete within reasonable timeframes (configurable timeouts)
**Security**: Custom scripts run in controlled environment with limited permissions
**Reliability**: Failed preprocessing should not leave system in inconsistent state
**Logging**: Comprehensive logging of all preprocessing steps
**Streaming**: Leverage rclone daemon's streaming capabilities for efficient data transfer

### User Requirements

**Configuration UI**: Simple dropdown to select preprocessing type with dynamic form fields
**Status Visibility**: Clear indication of preprocessing status in job monitoring
**Error Handling**: Meaningful error messages for preprocessing failures

## Design and Implementation

### Data Model Changes

**Internal DTO Classes for Validation** (not exposed via GraphQL):
```typescript
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsNumber, 
  IsArray, 
  IsEnum, 
  IsPositive, 
  Min, 
  Max, 
  ValidateNested, 
  IsNotEmpty,
  Matches
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PreprocessType {
  NONE = 'none',
  ZFS = 'zfs',
  FLASH = 'flash',
  SCRIPT = 'script'
}

export class ZfsPreprocessConfigDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-\/]+$/, { message: 'Pool name must contain only alphanumeric characters, underscores, hyphens, and forward slashes' })
  poolName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_\-]+$/, { message: 'Snapshot name must contain only alphanumeric characters, underscores, and hyphens' })
  snapshotName?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== false)
  streamDirect?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  compressionLevel?: number;
}

export class FlashPreprocessConfigDto {
  @IsOptional()
  @IsString()
  @Matches(/^\/[a-zA-Z0-9_\-\/\.]+$/, { message: 'Git path must be an absolute path' })
  gitPath?: string = '/boot/.git';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  compressionLevel?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== false)
  streamDirect?: boolean = true;

  @IsOptional()
  @IsString()
  @Matches(/^\/[a-zA-Z0-9_\-\/\.]+$/, { message: 'Local cache path must be an absolute path' })
  localCachePath?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  commitMessage?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value !== false)
  includeGitHistory?: boolean = true;
}

export class ScriptPreprocessConfigDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\/[a-zA-Z0-9_\-\/\.]+$/, { message: 'Script path must be an absolute path' })
  scriptPath!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scriptArgs?: string[];

  @IsOptional()
  @IsString()
  @Matches(/^\/[a-zA-Z0-9_\-\/\.]*$/, { message: 'Working directory must be an absolute path' })
  workingDirectory?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(3600)
  timeout?: number;
}

export class PreprocessConfigDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ZfsPreprocessConfigDto)
  zfs?: ZfsPreprocessConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlashPreprocessConfigDto)
  flash?: FlashPreprocessConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScriptPreprocessConfigDto)
  script?: ScriptPreprocessConfigDto;
}

// Internal DTO for service layer validation
export class BackupJobPreprocessDto {
  @IsEnum(PreprocessType)
  preprocessType!: PreprocessType;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreprocessConfigDto)
  preprocessConfig?: PreprocessConfigDto;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(3600)
  preprocessTimeout?: number = 300;

  @IsOptional()
  @IsBoolean()
  cleanupOnFailure?: boolean = true;
}

**Extended BackupJobConfigData Interface** (internal):
```typescript
interface BackupJobConfigData {
  // ... existing fields
  preprocessType?: 'none' | 'zfs' | 'flash' | 'script';
  preprocessConfig?: {
    zfs?: {
      poolName: string;
      snapshotName?: string;
      streamDirect?: boolean;
      compressionLevel?: number;
    };
    flash?: {
      gitPath?: string;
      compressionLevel?: number;
      streamDirect?: boolean;
      localCachePath?: string;
      commitMessage?: string;
      includeGitHistory?: boolean;
    };
    script?: {
      scriptPath: string;
      scriptArgs?: string[];
      workingDirectory?: string;
      timeout?: number;
    };
  };
  preprocessTimeout?: number;
  cleanupOnFailure?: boolean;
}
```

**GraphQL Schema Extensions** (only expose what UI needs):
```typescript
import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

registerEnumType(PreprocessType, {
  name: 'PreprocessType',
  description: 'Type of preprocessing to perform before backup'
});

// Extend existing BackupJobConfig ObjectType
@ObjectType({
    implements: () => Node,
})
export class BackupJobConfig extends Node {
  // ... existing fields

  @Field(() => PreprocessType, { nullable: true, defaultValue: PreprocessType.NONE })
  preprocessType?: PreprocessType;

  @Field(() => GraphQLJSON, { nullable: true, description: 'Preprocessing configuration' })
  preprocessConfig?: Record<string, unknown>;

  @Field(() => Number, { nullable: true, description: 'Preprocessing timeout in seconds' })
  preprocessTimeout?: number;

  @Field(() => Boolean, { nullable: true, description: 'Cleanup on failure' })
  cleanupOnFailure?: boolean;
}

// Extend existing input types
@InputType()
export class CreateBackupJobConfigInput {
  // ... existing fields

  @Field(() => PreprocessType, { nullable: true, defaultValue: PreprocessType.NONE })
  @IsOptional()
  @IsEnum(PreprocessType)
  preprocessType?: PreprocessType;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  preprocessConfig?: Record<string, unknown>;

  @Field(() => Number, { nullable: true, defaultValue: 300 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(3600)
  preprocessTimeout?: number;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  cleanupOnFailure?: boolean;
}

@InputType()
export class UpdateBackupJobConfigInput {
  // ... existing fields

  @Field(() => PreprocessType, { nullable: true })
  @IsOptional()
  @IsEnum(PreprocessType)
  preprocessType?: PreprocessType;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  preprocessConfig?: Record<string, unknown>;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(3600)
  preprocessTimeout?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  cleanupOnFailure?: boolean;
}
```

**Validation Service for Business Logic**:
```typescript
@Injectable()
export class PreprocessConfigValidationService {
  
  async validateAndTransform(input: any): Promise<BackupJobPreprocessDto> {
    // Transform to DTO and validate
    const dto = plainToClass(BackupJobPreprocessDto, input);
    const validationErrors = await validate(dto);
    
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map(error => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }
    
    // Custom business logic validation
    const businessErrors = this.validateBusinessRules(dto);
    if (businessErrors.length > 0) {
      throw new BadRequestException(`Configuration errors: ${businessErrors.join('; ')}`);
    }
    
    // Additional async validations
    await this.validateAsyncRules(dto);
    
    return dto;
  }
  
  private validateBusinessRules(dto: BackupJobPreprocessDto): string[] {
    const errors: string[] = [];
    
    // Ensure config matches type
    if (dto.preprocessType !== PreprocessType.NONE && !dto.preprocessConfig) {
      errors.push('Preprocessing configuration is required when preprocessType is not "none"');
    }
    
    if (dto.preprocessType === PreprocessType.ZFS && !dto.preprocessConfig?.zfs) {
      errors.push('ZFS configuration is required when preprocessType is "zfs"');
    }
    
    if (dto.preprocessType === PreprocessType.FLASH && !dto.preprocessConfig?.flash) {
      errors.push('Flash configuration is required when preprocessType is "flash"');
    }
    
    if (dto.preprocessType === PreprocessType.SCRIPT && !dto.preprocessConfig?.script) {
      errors.push('Script configuration is required when preprocessType is "script"');
    }
    
    // Flash-specific validations
    if (dto.preprocessConfig?.flash) {
      const flashConfig = dto.preprocessConfig.flash;
      
      if (flashConfig.localCachePath && flashConfig.streamDirect !== false) {
        errors.push('localCachePath can only be used when streamDirect is false');
      }
      
      if (flashConfig.gitPath && !flashConfig.gitPath.endsWith('/.git')) {
        errors.push('Git path should end with "/.git"');
      }
    }
    
    // ZFS-specific validations
    if (dto.preprocessConfig?.zfs) {
      const zfsConfig = dto.preprocessConfig.zfs;
      
      if (zfsConfig.poolName.includes('..') || zfsConfig.poolName.startsWith('/')) {
        errors.push('Invalid ZFS pool name format');
      }
    }
    
    // Script-specific validations
    if (dto.preprocessConfig?.script) {
      const scriptConfig = dto.preprocessConfig.script;
      
      if (!scriptConfig.scriptPath.match(/\.(sh|py|pl|js)$/)) {
        errors.push('Script must have a valid extension (.sh, .py, .pl, .js)');
      }
      
      if (scriptConfig.scriptArgs?.some(arg => arg.includes(';') || arg.includes('|') || arg.includes('&'))) {
        errors.push('Script arguments cannot contain shell operators (;, |, &)');
      }
    }
    
    return errors;
  }
  
  private async validateAsyncRules(dto: BackupJobPreprocessDto): Promise<void> {
    if (dto.preprocessType === PreprocessType.ZFS && dto.preprocessConfig?.zfs) {
      const poolExists = await this.validateZfsPool(dto.preprocessConfig.zfs.poolName);
      if (!poolExists) {
        throw new BadRequestException(`ZFS pool '${dto.preprocessConfig.zfs.poolName}' does not exist`);
      }
    }
    
    if (dto.preprocessType === PreprocessType.SCRIPT && dto.preprocessConfig?.script) {
      const scriptExists = await this.validateScriptExists(dto.preprocessConfig.script.scriptPath);
      if (!scriptExists) {
        throw new BadRequestException(`Script '${dto.preprocessConfig.script.scriptPath}' does not exist or is not executable`);
      }
    }
  }
  
  async validateZfsPool(poolName: string): Promise<boolean> {
    // Implementation would check if ZFS pool exists
    return true;
  }
  
  async validateScriptExists(scriptPath: string): Promise<boolean> {
    // Implementation would check if script file exists and is executable
    return true;
  }
}
```

**Service Integration**:
```typescript
// In BackupConfigService
constructor(
  private readonly rcloneService: RCloneService,
  private readonly schedulerRegistry: SchedulerRegistry,
  private readonly preprocessValidationService: PreprocessConfigValidationService,
  private readonly preprocessingService: PreprocessingService
) {
  // ... existing constructor logic
}

async createBackupJobConfig(input: CreateBackupJobConfigInput): Promise<BackupJobConfig> {
  // Validate preprocessing config if provided
  if (input.preprocessType && input.preprocessType !== PreprocessType.NONE) {
    await this.preprocessValidationService.validateAndTransform({
      preprocessType: input.preprocessType,
      preprocessConfig: input.preprocessConfig,
      preprocessTimeout: input.preprocessTimeout,
      cleanupOnFailure: input.cleanupOnFailure
    });
  }

  // ... rest of existing logic
}
```

**Key Benefits of This Approach**:
- **Separation of Concerns**: Internal DTOs handle validation, GraphQL schema only exposes what UI needs
- **Type Safety**: Full validation on internal DTOs, simple JSON for GraphQL flexibility
- **Minimal GraphQL Changes**: Only add essential fields to existing schema
- **Backward Compatibility**: Existing backup jobs continue to work (preprocessType defaults to 'none')
- **Flexible Configuration**: UI can send any valid JSON, validated internally by DTOs
- **Future-Proof**: Easy to add new preprocessing types without GraphQL schema changes

### Architecture Overview

**Preprocessing Service**: New service to handle different preprocessing types
**Streaming Integration**: Direct integration with rclone daemon for streaming operations
**Job Execution Flow**: Modified to include preprocessing step with streaming support
**Cleanup Management**: Automatic cleanup of temporary resources

### API Specifications

**New Preprocessing Service Methods**:
- `executePreprocessing(config, jobId): Promise<PreprocessResult>`
- `executeStreamingPreprocessing(config, jobId): Promise<PreprocessResult>`
- `cleanupPreprocessing(config, jobId): Promise<void>`
- `validatePreprocessConfig(config): ValidationResult`

**PreprocessResult Interface**:
```typescript
interface PreprocessResult {
  success: boolean;
  outputPath?: string; // Path to the final backup destination
  localCachePath?: string; // Path to local cache file (if used)
  streaming: boolean; // Whether the operation used streaming
  message: string; // Human-readable status message
  metadata?: {
    gitCommitHash?: string; // For flash backups
    snapshotName?: string; // For ZFS backups
    scriptExitCode?: number; // For custom scripts
    bytesProcessed?: number;
    processingTimeMs?: number;
  };
}
```

## Development Details

### Implementation Approach

**Phase 1**: Core preprocessing infrastructure
- Add preprocessing fields to data models
- Create base preprocessing service
- Implement 'none' type (current behavior)

**Phase 2**: RCloneApiService streaming extensions
- Add `startStreamingBackup()` method to handle rcat subprocess operations
- Implement streaming job tracking that integrates with existing job system
- Create streaming job status monitoring (bridge subprocess with daemon job tracking)
- Add streaming job cancellation capabilities (process management + cleanup)
- Extend job grouping to include streaming operations under `JOB_GROUP_PREFIX`

**Phase 3**: Streaming job management integration
- Modify `getAllJobsWithStats()` to include streaming jobs alongside daemon jobs
- Update `getEnhancedJobStatus()` to handle both daemon and streaming job types
- Implement streaming job progress monitoring (file size, transfer rate estimation)
- Add streaming job error handling and retry logic
- Ensure streaming jobs appear in backup job lists with proper status

**Phase 4**: Flash backup integration (Priority Feature)
- Local git repository setup and configuration
- Git filters and exclusions for proper file handling
- Local commit operations for configuration tracking
- Git repository streaming compression using `tar cf - /boot/.git | rclone rcat remote:backup.tar`
- Direct streaming to destination via rclone daemon
- No temporary local storage required
- Simplified approach without remote git operations or Unraid Connect dependency

**Phase 5**: ZFS snapshot support
- ZFS snapshot creation/deletion
- Streaming via `zfs send | rclone rcat remote:backup`
- Error handling for ZFS operations
- Cleanup of temporary snapshots

**Phase 6**: Custom script support
- Script execution in sandboxed environment
- File-based output (non-streaming for security)
- Parameter passing and environment setup
- Security restrictions and validation

### Streaming Implementation Details

**ZFS Streaming with RClone Daemon API**:
```typescript
// Use RCloneApiService.startBackup() with streaming source
const zfsCommand = `zfs send pool/dataset@backup-timestamp`;
const destinationPath = `${config.remoteName}:${config.destinationPath}/zfs-backup-timestamp`;

// Stream ZFS data directly to rclone daemon via API
await this.executeStreamingBackup(zfsCommand, destinationPath, config);
```

**Flash Backup Streaming with Complete Git Setup**:
```typescript
// Simplified flash backup preprocessing without remote git operations
async executeFlashBackupPreprocessing(config: FlashBackupConfig, jobId: string): Promise<PreprocessResult> {
  try {
    // 1. Initialize/configure local git repository (always done)
    await this.setupLocalGitRepository();
    
    // 2. Configure git filters and exclusions
    await this.configureGitFilters();
    
    // 3. Perform local git operations (add, commit locally only)
    await this.performLocalGitOperations(config.commitMessage || 'Backup via comprehensive backup system');
    
    // 4. Create backup - either streaming or local cache
    if (config.streamDirect !== false) {
      // Stream git repository directly to destination
      const tarCommand = `tar cf - -C /boot .git`;
      const destinationPath = `${config.remoteName}:${config.destinationPath}/flash-backup-${Date.now()}.tar`;
      
      await this.executeStreamingBackup(tarCommand, destinationPath, config);
      
      return {
        success: true,
        outputPath: destinationPath,
        streaming: true,
        message: 'Flash backup streamed successfully to destination'
      };
    } else {
      // Create local backup file first, then upload via rclone
      const localCachePath = config.localCachePath || `/tmp/flash-backup-${Date.now()}.tar`;
      const destinationPath = `${config.remoteName}:${config.destinationPath}/flash-backup-${Date.now()}.tar`;
      
      // Create local tar file
      await this.executeCommand(`tar cf "${localCachePath}" -C /boot .git`);
      
      // Upload via standard rclone
      await this.executeStandardBackup(localCachePath, destinationPath, config);
      
      // Cleanup local cache if it was auto-generated
      if (!config.localCachePath) {
        await this.deleteFile(localCachePath);
      }
      
      return {
        success: true,
        outputPath: destinationPath,
        streaming: false,
        localCachePath: config.localCachePath ? localCachePath : undefined,
        message: 'Flash backup completed successfully via local cache'
      };
    }
    
  } catch (error) {
    this.logger.error(`Flash backup preprocessing failed: ${error.message}`);
    throw new Error(`Flash backup failed: ${error.message}`);
  }
}

private async setupLocalGitRepository(): Promise<void> {
  // Initialize git repository if needed
  if (!await this.fileExists('/boot/.git/info/exclude')) {
    await this.executeCommand('git init /boot');
  }
  
  // Setup git description
  const varConfig = await this.readConfigFile('/var/local/emhttp/var.ini');
  const serverName = varConfig?.NAME || 'Unknown Server';
  const gitDescText = `Unraid flash drive for ${serverName}\n`;
  const gitDescPath = '/boot/.git/description';
  
  if (!await this.fileExists(gitDescPath) || await this.readFile(gitDescPath) !== gitDescText) {
    await this.writeFile(gitDescPath, gitDescText);
  }
  
  // Configure git user
  await this.setGitConfig('user.email', 'gitbot@unraid.net');
  await this.setGitConfig('user.name', 'gitbot');
}

private async performLocalGitOperations(commitMessage: string): Promise<void> {
  // Check status
  const { stdout: statusOutput } = await this.executeCommand('git -C /boot status --porcelain');
  
  let needsCommit = false;
  if (statusOutput.trim().length > 0) {
    needsCommit = true;
  } else {
    // Check for uncommitted changes
    const { stdout: diffOutput } = await this.executeCommand('git -C /boot diff --cached --name-only', { allowFailure: true });
    if (diffOutput.trim().length > 0) {
      needsCommit = true;
    }
  }
  
  if (needsCommit) {
    // Remove invalid files from repo
    const { stdout: invalidFiles } = await this.executeCommand('git -C /boot ls-files --cached --ignored --exclude-standard', { allowFailure: true });
    if (invalidFiles.trim()) {
      for (const file of invalidFiles.trim().split('\n')) {
        if (file.trim()) {
          await this.executeCommand(`git -C /boot rm --cached --ignore-unmatch '${file.trim()}'`);
        }
      }
    }
    
    // Add and commit changes locally only
    await this.executeCommand('git -C /boot add -A');
    await this.executeCommand(`git -C /boot commit -m "${commitMessage}"`);
    
    this.logger.log('Local git commit completed for flash backup');
  } else {
    this.logger.log('No changes detected, skipping git commit');
  }
}

### Streaming Implementation Details

**ZFS Streaming with RClone Daemon API**:
```typescript
// Use RCloneApiService.startBackup() with streaming source
const zfsCommand = `zfs send pool/dataset@backup-timestamp`;
const destinationPath = `${config.remoteName}:${config.destinationPath}/zfs-backup-timestamp`;

// Stream ZFS data directly to rclone daemon via API
await this.executeStreamingBackup(zfsCommand, destinationPath, config);
```

**Flash Backup Streaming with RClone Daemon API**:
```typescript
// Stream git archive directly to rclone daemon
const tarCommand = `tar cf - /boot/.git`;
const destinationPath = `${config.remoteName}:${config.destinationPath}/flash-backup-timestamp.tar`;

await this.executeStreamingBackup(tarCommand, destinationPath, config);
```

**Docker Volume Streaming with RClone Daemon API**:
```typescript
// Stop container, stream volume data, restart container
await this.dockerService.stopContainer(config.containerName);
const dockerCommand = `docker run --rm -v ${config.volumeName}:/data alpine tar cf - /data`;
const destinationPath = `${config.remoteName}:${config.destinationPath}/docker-backup-timestamp.tar`;

await this.executeStreamingBackup(dockerCommand, destinationPath, config);
await this.dockerService.startContainer(config.containerName);
```

**Implementation Notes**:
- **Hybrid Approach**: Use direct `rclone rcat` calls for streaming operations, daemon API for everything else
- **Streaming Method**: Direct `rclone rcat` subprocess with piped input from preprocessing commands
- **Job Management**: Leverage existing RCloneApiService for configuration, monitoring, and job tracking
- **Compression Handling**: User configures compress remote in UI, we just use their chosen remote
- **Error Handling**: Combine subprocess error handling with existing RCloneApiService retry logic
- **Process Management**: Proper cleanup of streaming subprocesses and monitoring integration

**API Integration Points**:
- `RCloneApiService.getRemoteConfig()` for validating user's remote configuration
- `RCloneApiService.getEnhancedJobStatus()` for monitoring progress (if possible to correlate)
- `RCloneApiService.stopJob()` for cancellation (may need custom process management)
- Existing job grouping with `JOB_GROUP_PREFIX` for backup jobs
- Custom subprocess management for streaming operations

### Subprocess Lifecycle Management

**Process Tracking**:
```typescript
interface StreamingJobProcess {
  jobId: string;
  configId: string;
  subprocess: ChildProcess;
  startTime: Date;
  command: string;
  destinationPath: string;
  status: 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
  bytesTransferred?: number;
  error?: string;
}

class StreamingJobManager {
  private activeProcesses = new Map<string, StreamingJobProcess>();
  private readonly logger = new Logger(StreamingJobManager.name);
  
  async startStreamingJob(command: string, destination: string, configId: string): Promise<string> {
    const jobId = `stream-${uuidv4()}`;
    const subprocess = spawn('sh', ['-c', `${command} | rclone rcat ${destination}`]);
    
    const processInfo: StreamingJobProcess = {
      jobId,
      configId,
      subprocess,
      startTime: new Date(),
      command,
      destinationPath: destination,
      status: 'starting'
    };
    
    this.activeProcesses.set(jobId, processInfo);
    this.setupProcessHandlers(processInfo);
    return jobId;
  }
  
  private setupProcessHandlers(processInfo: StreamingJobProcess): void {
    const { subprocess, jobId } = processInfo;
    
    subprocess.on('spawn', () => {
      processInfo.status = 'running';
      this.logger.log(`Streaming job ${jobId} started successfully`);
    });
    
    subprocess.on('exit', (code, signal) => {
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        processInfo.status = 'cancelled';
      } else if (code === 0) {
        processInfo.status = 'completed';
      } else {
        processInfo.status = 'failed';
        processInfo.error = `Process exited with code ${code}`;
      }
      
      this.logger.log(`Streaming job ${jobId} finished with status: ${processInfo.status}`);
      // Keep process info for status queries, cleanup after timeout
      setTimeout(() => this.activeProcesses.delete(jobId), 300000); // 5 minutes
    });
    
    subprocess.on('error', (error) => {
      processInfo.status = 'failed';
      processInfo.error = error.message;
      this.logger.error(`Streaming job ${jobId} failed:`, error);
    });
  }
  
  async stopStreamingJob(jobId: string): Promise<boolean> {
    const processInfo = this.activeProcesses.get(jobId);
    if (!processInfo || processInfo.status === 'completed' || processInfo.status === 'failed') {
      return false;
    }
    
    processInfo.status = 'cancelled';
    processInfo.subprocess.kill('SIGTERM');
    
    // Force kill after 10 seconds if still running
    setTimeout(() => {
      if (!processInfo.subprocess.killed) {
        processInfo.subprocess.kill('SIGKILL');
      }
    }, 10000);
    
    return true;
  }
}
```

**Service Shutdown Cleanup**:
```typescript
async onModuleDestroy(): Promise<void> {
  this.logger.log('Cleaning up streaming processes...');
  
  const activeJobs = Array.from(this.activeProcesses.values())
    .filter(p => p.status === 'running' || p.status === 'starting');
  
  if (activeJobs.length > 0) {
    this.logger.log(`Terminating ${activeJobs.length} active streaming jobs`);
    
    // Graceful termination
    activeJobs.forEach(job => job.subprocess.kill('SIGTERM'));
    
    // Wait up to 5 seconds for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Force kill any remaining processes
    activeJobs.forEach(job => {
      if (!job.subprocess.killed) {
        job.subprocess.kill('SIGKILL');
      }
    });
  }
}
```

### Job Status Correlation

**Unified Job Status System**:
```typescript
interface UnifiedJobStatus {
  id: string;
  type: 'daemon' | 'streaming';
  configId?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    bytesTransferred: number;
    totalBytes?: number;
    transferRate: number;
    eta?: number;
  };
  startTime: Date;
  endTime?: Date;
  error?: string;
}

async getAllJobsWithStats(): Promise<RCloneJob[]> {
  // Get existing daemon jobs
  const daemonJobs = await this.getExistingDaemonJobs();
  
  // Get streaming jobs and convert to RCloneJob format
  const streamingJobs = Array.from(this.streamingManager.activeProcesses.values())
    .filter(p => p.status === 'running' || p.status === 'starting')
    .map(p => this.convertStreamingToRCloneJob(p));
  
  return [...daemonJobs, ...streamingJobs];
}

private convertStreamingToRCloneJob(processInfo: StreamingJobProcess): RCloneJob {
  return {
    id: processInfo.jobId,
    configId: processInfo.configId,
    status: this.mapStreamingStatus(processInfo.status),
    group: `${JOB_GROUP_PREFIX}${processInfo.configId}`,
    startTime: processInfo.startTime.toISOString(),
    stats: {
      bytes: processInfo.bytesTransferred || 0,
      speed: this.estimateTransferRate(processInfo),
      eta: null, // Streaming jobs don't have reliable ETA
      transferring: processInfo.status === 'running' ? [processInfo.destinationPath] : [],
      checking: [],
      errors: processInfo.error ? 1 : 0,
      fatalError: processInfo.status === 'failed',
      finished: processInfo.status === 'completed' || processInfo.status === 'failed'
    }
  };
}
```

**Progress Monitoring for Streaming Jobs**:
```typescript
private estimateTransferRate(processInfo: StreamingJobProcess): number {
  if (!processInfo.bytesTransferred || processInfo.status !== 'running') {
    return 0;
  }
  
  const elapsedSeconds = (Date.now() - processInfo.startTime.getTime()) / 1000;
  return elapsedSeconds > 0 ? processInfo.bytesTransferred / elapsedSeconds : 0;
}

// Monitor subprocess output to track progress
private setupProgressMonitoring(processInfo: StreamingJobProcess): void {
  let lastProgressUpdate = Date.now();
  
  processInfo.subprocess.stderr?.on('data', (data) => {
    const output = data.toString();
    
    // Parse rclone progress output (if available)
    const progressMatch = output.match(/Transferred:\s+(\d+(?:\.\d+)?)\s*(\w+)/);
    if (progressMatch) {
      const [, amount, unit] = progressMatch;
      processInfo.bytesTransferred = this.parseBytes(amount, unit);
      lastProgressUpdate = Date.now();
    }
  });
  
  // Fallback: estimate progress based on time for jobs without progress output
  const progressEstimator = setInterval(() => {
    if (processInfo.status !== 'running') {
      clearInterval(progressEstimator);
      return;
    }
    
    // If no progress updates for 30 seconds, job might be stalled
    if (Date.now() - lastProgressUpdate > 30000) {
      this.logger.warn(`No progress updates for streaming job ${processInfo.jobId} for 30 seconds`);
    }
  }, 10000);
}
```

### Error Recovery and Retry Logic

**Streaming-Specific Error Handling**:
```typescript
async executeStreamingBackup(command: string, destination: string, config: any): Promise<void> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const jobId = await this.streamingManager.startStreamingJob(command, destination, config.id);
      await this.waitForStreamingCompletion(jobId);
      return; // Success
      
    } catch (error) {
      attempt++;
      this.logger.warn(`Streaming backup attempt ${attempt} failed:`, error);
      
      if (attempt >= maxRetries) {
        throw new Error(`Streaming backup failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

private async waitForStreamingCompletion(jobId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const checkStatus = () => {
      const processInfo = this.streamingManager.activeProcesses.get(jobId);
      
      if (!processInfo) {
        reject(new Error(`Streaming job ${jobId} not found`));
        return;
      }
      
      switch (processInfo.status) {
        case 'completed':
          resolve();
          break;
        case 'failed':
          reject(new Error(processInfo.error || 'Streaming job failed'));
          break;
        case 'cancelled':
          reject(new Error('Streaming job was cancelled'));
          break;
        default:
          // Still running, check again in 1 second
          setTimeout(checkStatus, 1000);
      }
    };
    
    checkStatus();
  });
}

// Handle partial stream failures
private async handleStreamingFailure(processInfo: StreamingJobProcess): Promise<void> {
  this.logger.error(`Streaming job ${processInfo.jobId} failed, attempting cleanup`);
  
  // Kill subprocess if still running
  if (!processInfo.subprocess.killed) {
    processInfo.subprocess.kill('SIGTERM');
  }
  
  // Check if partial data was uploaded and needs cleanup
  try {
    // Attempt to remove partial upload from destination
    await this.cleanupPartialUpload(processInfo.destinationPath);
  } catch (cleanupError) {
    this.logger.warn(`Failed to cleanup partial upload: ${cleanupError.message}`);
  }
}
```

### Concurrency Management

**Resource Limits and Throttling**:
```typescript
interface ConcurrencyConfig {
  maxConcurrentStreaming: number;
  maxConcurrentPerConfig: number;
  maxTotalBandwidth: number; // bytes per second
  queueTimeout: number; // milliseconds
}

class ConcurrencyManager {
  private readonly config: ConcurrencyConfig = {
    maxConcurrentStreaming: 3,
    maxConcurrentPerConfig: 1,
    maxTotalBandwidth: 100 * 1024 * 1024, // 100 MB/s
    queueTimeout: 300000 // 5 minutes
  };
  
  private readonly jobQueue: Array<{
    configId: string;
    command: string;
    destination: string;
    resolve: (jobId: string) => void;
    reject: (error: Error) => void;
    queuedAt: Date;
  }> = [];
  
  async queueStreamingJob(command: string, destination: string, configId: string): Promise<string> {
    // Check immediate availability
    if (this.canStartImmediately(configId)) {
      return this.streamingManager.startStreamingJob(command, destination, configId);
    }
    
    // Queue the job
    return new Promise((resolve, reject) => {
      this.jobQueue.push({
        configId,
        command,
        destination,
        resolve,
        reject,
        queuedAt: new Date()
      });
      
      // Set timeout for queued job
      setTimeout(() => {
        const index = this.jobQueue.findIndex(job => job.resolve === resolve);
        if (index !== -1) {
          this.jobQueue.splice(index, 1);
          reject(new Error('Job timed out in queue'));
        }
      }, this.config.queueTimeout);
      
      this.processQueue();
    });
  }
  
  private canStartImmediately(configId: string): boolean {
    const activeJobs = Array.from(this.streamingManager.activeProcesses.values())
      .filter(p => p.status === 'running' || p.status === 'starting');
    
    // Check global concurrent limit
    if (activeJobs.length >= this.config.maxConcurrentStreaming) {
      return false;
    }
    
    // Check per-config limit
    const configJobs = activeJobs.filter(p => p.configId === configId);
    if (configJobs.length >= this.config.maxConcurrentPerConfig) {
      return false;
    }
    
    // Check bandwidth usage
    const totalBandwidth = activeJobs.reduce((sum, job) => 
      sum + this.estimateTransferRate(job), 0);
    if (totalBandwidth >= this.config.maxTotalBandwidth) {
      return false;
    }
    
    return true;
  }
  
  private async processQueue(): Promise<void> {
    while (this.jobQueue.length > 0) {
      const job = this.jobQueue[0];
      
      // Remove expired jobs
      if (Date.now() - job.queuedAt.getTime() > this.config.queueTimeout) {
        this.jobQueue.shift();
        job.reject(new Error('Job expired in queue'));
        continue;
      }
      
      if (this.canStartImmediately(job.configId)) {
        this.jobQueue.shift();
        try {
          const jobId = await this.streamingManager.startStreamingJob(
            job.command, 
            job.destination, 
            job.configId
          );
          job.resolve(jobId);
        } catch (error) {
          job.reject(error);
        }
      } else {
        break; // Can't start any more jobs right now
      }
    }
  }
  
  // Called when streaming jobs complete to process queue
  onStreamingJobComplete(): void {
    this.processQueue();
  }
}
```

**Integration with Existing Job Grouping**:
```typescript
// Extend existing job grouping to include streaming operations
async stopJob(jobId: string): Promise<JobOperationResult> {
  // Check if this is a streaming job
  if (jobId.startsWith('stream-')) {
    const success = await this.streamingManager.stopStreamingJob(jobId);
    return {
      stopped: success ? [jobId] : [],
      errors: success ? [] : [`Failed to stop streaming job ${jobId}`]
    };
  }
  
  // Handle daemon jobs and groups as before
  if (jobId.startsWith(JOB_GROUP_PREFIX)) {
    // Stop all jobs in the group (both daemon and streaming)
    const groupJobs = await this.getJobsInGroup(jobId);
    const results = await Promise.allSettled(
      groupJobs.map(job => this.stopJob(job.id))
    );
    
    return this.aggregateStopResults(results);
  }
  
  // Regular daemon job
  return this.executeJobOperation([jobId], 'stop');
}
```

## Testing Approach

### Test Cases

**Unit Tests**:
- Preprocessing service methods
- Configuration validation
- Error handling scenarios
- Streaming pipeline validation

**Integration Tests**:
- End-to-end backup workflows with preprocessing
- ZFS snapshot streaming operations
- Docker container management with streaming
- Flash backup streaming compression
- Rclone daemon integration

**Edge Cases**:
- Network failures during streaming
- ZFS snapshot creation failures
- Docker container stop/start failures
- Permission issues with ZFS/Docker operations
- Malformed custom scripts
- Streaming interruption and recovery

### Acceptance Criteria

1. User can select preprocessing type in backup job configuration
2. ZFS snapshot backups stream directly to destination without local storage
3. Flash backup streams compressed archive directly to destination
4. Docker containers are safely stopped/started with volume data streamed
5. Custom scripts execute with proper error handling (file-based output)
6. All streaming operations respect timeout settings
7. Failed preprocessing operations clean up properly (including snapshots)
8. Job status accurately reflects preprocessing progress
9. Streaming operations show real-time progress

## Future Considerations

### Scalability Plans
- Support for multiple preprocessing steps per job
- Parallel preprocessing for multiple backup sources
- Preprocessing step templates and sharing
- Advanced streaming compression algorithms

### Enhancement Ideas
- Database dump preprocessing with streaming (MySQL/PostgreSQL)
- VM snapshot integration with streaming
- Network share mounting/unmounting
- Encryption preprocessing steps
- Multi-stream parallel processing

### Known Limitations
- Custom scripts limited to file-based operations (no streaming for security)
- ZFS operations require appropriate system permissions
- Docker operations require Docker daemon access
- Streaming operations require sufficient network bandwidth for real-time processing
- Streaming failures may require full restart (no partial resume capability)

## Migration from UpdateFlashBackup.php

### Replacement Strategy

**Local Git Repository Management**:
- Local git repository initialization and configuration
- Git filters and exclusions setup for proper file handling
- Local commit operations to track configuration changes
- Streaming backup of git repository without remote synchronization
- No Unraid Connect authentication or remote git push operations

**Simplified Approach**:
- Focus on local git repository preparation and streaming
- Remove dependency on Unraid Connect for backup operations
- Maintain git history locally for configuration tracking
- Stream entire git repository to backup destination
- Preserve existing UpdateFlashBackup.php for users who need remote sync

**Enhanced Features**:
- Integration with comprehensive backup job system
- Unified monitoring and status reporting
- Streaming capabilities for faster, more efficient backups
- Better error handling and retry logic
- Consistent logging and debugging across all backup types

**Migration Steps**:
1. Implement local git preprocessing in backup system
2. Add UI option to use new local flash backup method
3. Test new system alongside existing UpdateFlashBackup.php
4. Allow users to choose between local backup and remote sync
5. Maintain both options for different use cases

**Configuration Mapping**:
```typescript
// Legacy UpdateFlashBackup.php (for remote sync)
const legacyFlashBackup = {
  command: 'update',
  commitmsg: 'Config change'
};

// New local preprocessing configuration
const newLocalFlashBackup: BackupJobConfigData = {
  preprocessType: 'flash',
  preprocessConfig: {
    flash: {
      gitPath: '/boot/.git',
      streamDirect: true,
      commitMessage: 'Config change',
      includeGitHistory: true
    }
  },
  // ... other backup job config
};

// Alternative with local cache
const newLocalFlashBackupWithCache: BackupJobConfigData = {
  preprocessType: 'flash',
  preprocessConfig: {
    flash: {
      gitPath: '/boot/.git',
      streamDirect: false,
      localCachePath: '/mnt/cache/flash-backup.tar',
      commitMessage: 'Config change',
      includeGitHistory: true
    }
  },
  // ... other backup job config
};
```

**Benefits of Local Approach**:
- No dependency on Unraid Connect for backup operations
- Faster backup process without remote authentication
- Unified backup system for all backup types
- Streaming capabilities reduce local storage requirements (when streamDirect=true)
- Local cache option for scenarios requiring intermediate storage
- Better integration with existing backup monitoring
- Consistent error handling and retry logic
```

**Validation Usage in Services**:
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class BackupConfigService {
  constructor(
    private readonly validationService: PreprocessConfigValidationService
  ) {}

  async validateAndCreateBackupJob(input: any): Promise<BackupJobConfig> {
    // Transform and validate DTO
    const dto = plainToClass(BackupJobPreprocessDto, input);
    const validationErrors = await validate(dto);
    
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map(error => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }
    
    // Custom business logic validation
    const businessErrors = this.validationService.validateConfig(dto);
    if (businessErrors.length > 0) {
      throw new BadRequestException(`Configuration errors: ${businessErrors.join('; ')}`);
    }
    
    // Additional async validations
    const poolExists = await this.validationService.validateZfsPool(dto.preprocessConfig?.zfs?.poolName || '');
    if (!poolExists) {
      throw new BadRequestException(`ZFS pool '${dto.preprocessConfig?.zfs?.poolName}' does not exist`);
    }
    
    if (dto.preprocessType === PreprocessType.SCRIPT && dto.preprocessConfig?.script) {
      const scriptExists = await this.validationService.validateScriptExists(dto.preprocessConfig.script.scriptPath);
      if (!scriptExists) {
        throw new BadRequestException(`Script '${dto.preprocessConfig.script.scriptPath}' does not exist or is not executable`);
      }
    }
    
    // Convert DTO to domain model
    return this.convertDtoToModel(dto);
  }
  
  private convertDtoToModel(dto: BackupJobPreprocessDto): BackupJobConfig {
    // Implementation to convert validated DTO to internal model
    return {
      preprocessType: dto.preprocessType,
      preprocessConfig: dto.preprocessConfig,
      preprocessTimeout: dto.preprocessTimeout,
      cleanupOnFailure: dto.cleanupOnFailure
    } as BackupJobConfig;
  }
}

// GraphQL Resolver with validation
@Resolver()
export class BackupJobResolver {
  constructor(
    private readonly backupConfigService: BackupConfigService
  ) {}

  @Mutation(() => BackupJobConfig)
  async createBackupJob(
    @Args('input') input: BackupJobPreprocessInput
  ): Promise<BackupJobConfig> {
    return this.backupConfigService.validateAndCreateBackupJob(input);
  }
  
  @Mutation(() => BackupJobConfig)
  async updateBackupJob(
    @Args('id') id: string,
    @Args('input') input: Partial<BackupJobPreprocessInput>
  ): Promise<BackupJobConfig> {
    // Merge with existing config and validate
    const existingConfig = await this.getExistingConfig(id);
    const mergedInput = { ...existingConfig, ...input };
    return this.backupConfigService.validateAndCreateBackupJob(mergedInput);
  }
}

// Validation pipe for automatic DTO validation
import { ValidationPipe } from '@nestjs/common';

// In main.ts or module configuration
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validateCustomDecorators: true
}));
```
</everythingElse>
</Climb>