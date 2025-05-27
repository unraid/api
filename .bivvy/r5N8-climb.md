# Backup Source and Destination Processor Refactoring

<Climb>
  <header>
    <id>r5N8</id>
    <type>task</type>
    <description>Continue refactoring backup system to use separate source and destination processors with support for both streaming and non-streaming backups</description>
  </header>
  
  <newDependencies>
    None - this is a refactoring task using existing dependencies
  </newDependencies>
  
  <prerequisiteChanges>
    - Flash source processor and RClone destination processor are already implemented
    - Raw source processor exists but may need updates for streaming compatibility
    - Backup service infrastructure exists but needs integration with new processor pattern
  </prerequisiteChanges>
  
  <relevantFiles>
    - api/src/unraid-api/graph/resolvers/backup/source/flash/flash-source-processor.service.ts (already implemented)
    - api/src/unraid-api/graph/resolvers/backup/destination/rclone/rclone-destination-processor.service.ts (already implemented)
    - api/src/unraid-api/graph/resolvers/backup/source/raw/raw-source-processor.service.ts (needs streaming support)
    - api/src/unraid-api/graph/resolvers/backup/backup-config.service.ts (needs processor integration)
    - api/src/unraid-api/graph/resolvers/backup/source/backup-source-processor.interface.ts
    - api/src/unraid-api/graph/resolvers/backup/destination/backup-destination-processor.interface.ts
    - api/src/unraid-api/graph/resolvers/rclone/rclone-api.service.ts (streaming job service)
    - api/src/unraid-api/graph/resolvers/backup/backup.model.ts (backup config models)
  </relevantFiles>
</Climb>

## Overview

This task implements a clean backup system architecture using separate source and destination processors with support for both streaming and non-streaming backup workflows. Since this is a new system, we can implement the optimal design without backward compatibility concerns.

## Current State Analysis

### Already Implemented
- **FlashSourceProcessor**: Supports streaming via tar command generation for git history inclusion
- **RCloneDestinationProcessor**: Handles both streaming and regular uploads to RClone remotes
- **RawSourceProcessor**: Basic implementation without streaming support

### Architecture Pattern
The processor pattern separates:
1. **Source Processors**: Handle data preparation, validation, and streaming command generation
2. **Destination Processors**: Handle upload/transfer logic with streaming support
3. **Backup Service**: Orchestrates the flow between source and destination processors

## Requirements

### Functional Requirements

#### Backup Config Simplification
- **Main Backup Config** should only contain:
  - Job ID and name
  - Cron schedule
  - Enabled/disabled status
  - Created/updated timestamps
  - Last run metadata (status, timestamp)
- **Source Config** should contain all source-specific configuration
- **Destination Config** should contain all destination-specific configuration
- Remove redundant fields from main config (remoteName, destinationPath, rcloneOptions, etc.)

#### Source Processor Interface
- All source processors must implement consistent validation
- Streaming-capable sources should generate stream commands (command + args)
- Non-streaming sources should provide direct file/directory paths
- Metadata should include streaming capability flags

#### Destination Processor Interface  
- Support both streaming and non-streaming inputs
- Handle progress reporting and error handling consistently
- Provide cleanup capabilities for failed transfers

#### Backup Service Integration
- Automatically detect streaming vs non-streaming workflows
- Route streaming backups through streaming job service
- Route regular backups through standard backup service
- Maintain consistent job tracking and status reporting

### Technical Requirements

#### Simplified Backup Config Structure
```typescript
interface BackupJobConfig {
    id: string
    name: string
    schedule: string
    enabled: boolean
    sourceType: SourceType
    destinationType: DestinationType
    sourceConfig: SourceConfig  // Type varies by sourceType
    destinationConfig: DestinationConfig  // Type varies by destinationType
    createdAt: string
    updatedAt: string
    lastRunAt?: string
    lastRunStatus?: string
    currentJobId?: string
}
```

#### Streaming Detection Logic
```typescript
if (sourceResult.streamCommand && destinationConfig.useStreaming) {
    // Use streaming workflow
    await streamingJobService.execute(sourceResult, destinationConfig)
} else {
    // Use regular workflow  
    await backupService.execute(sourceResult.outputPath, destinationConfig)
}
```

#### Error Handling
- Consistent error propagation between processors
- Cleanup coordination between source and destination
- Timeout handling for both streaming and non-streaming operations

#### Progress Reporting
- Unified progress interface across streaming and non-streaming
- Real-time status updates for long-running operations
- Metadata preservation throughout the pipeline

## Implementation Details

### Backup Config Model Refactoring

#### Current Issues
- Main config contains source-specific fields (sourceConfig with nested type-specific configs)
- Main config contains destination-specific fields (remoteName, destinationPath, rcloneOptions)
- Mixed concerns make the config complex and hard to extend

#### New Structure
```typescript
// Simplified main config
interface BackupJobConfig {
    id: string
    name: string
    schedule: string
    enabled: boolean
    sourceType: SourceType
    destinationType: DestinationType
    sourceConfig: FlashSourceConfig | RawSourceConfig | ZfsSourceConfig | ScriptSourceConfig
    destinationConfig: RCloneDestinationConfig | LocalDestinationConfig
    createdAt: string
    updatedAt: string
    lastRunAt?: string
    lastRunStatus?: string
    currentJobId?: string
}

// Source configs contain all source-specific settings
interface RCloneDestinationConfig {
    remoteName: string
    remotePath: string
    transferOptions?: Record<string, unknown>
    useStreaming?: boolean
    timeout: number
    cleanupOnFailure: boolean
}
```

### Source Processor Updates Needed

#### Raw Source Processor Enhancements
- Add streaming command generation for tar-based compression
- Implement include/exclude pattern handling in stream commands
- Add metadata flags for streaming capability
- Support both streaming and non-streaming modes

#### ZFS Source Processor (Future)
- Will need streaming support for ZFS snapshot transfers
- Should generate appropriate zfs send commands
- Handle incremental vs full backup streaming

#### Script Source Processor (Future)  
- Execute custom scripts and stream their output
- Handle script validation and execution environment
- Support both file output and streaming output modes

### Backup Service Orchestration

#### Workflow Detection
```typescript
async executeBackup(config: BackupJobConfig): Promise<BackupResult> {
    const sourceProcessor = this.getSourceProcessor(config.sourceType)
    const destinationProcessor = this.getDestinationProcessor(config.destinationType)
    
    const sourceResult = await sourceProcessor.execute(config.sourceConfig)
    
    if (sourceResult.streamCommand && destinationProcessor.supportsStreaming) {
        return this.executeStreamingBackup(sourceResult, config.destinationConfig)
    } else {
        return this.executeRegularBackup(sourceResult, config.destinationConfig)
    }
}
```

#### Job Management Integration
- Update backup-config.service.ts to use processor pattern
- Maintain existing cron scheduling functionality
- Preserve job status tracking and metadata storage
- Handle processor-specific cleanup requirements

### Interface Standardization

#### BackupSourceResult Enhancement
```typescript
interface BackupSourceResult {
    success: boolean
    outputPath?: string
    streamPath?: string  // For streaming sources
    streamCommand?: string
    streamArgs?: string[]
    metadata: Record<string, unknown>
    cleanupRequired?: boolean
    error?: string
}
```

#### BackupDestinationConfig Enhancement
```typescript
interface BackupDestinationConfig {
    timeout: number
    cleanupOnFailure: boolean
    useStreaming?: boolean
    supportsStreaming?: boolean
    // destination-specific config
}
```

## Implementation Strategy

### Core Implementation Tasks
1. **Refactor Backup Config Models** - Simplify main config and move specific settings to source/destination configs
2. **Update Raw Source Processor** - Add streaming support with tar command generation
3. **Create Backup Orchestration Service** - Implement workflow detection and processor coordination
4. **Update Backup Config Service** - Integrate with new processor pattern and simplified config structure
5. **Update GraphQL Schema** - Reflect new config structure in API
6. **Add Comprehensive Testing** - Unit and integration tests for all workflows

### Backup Config Refactoring
- Remove source-specific fields from main BackupJobConfig
- Remove destination-specific fields from main BackupJobConfig
- Create proper TypeScript union types for sourceConfig and destinationConfig
- Update GraphQL input/output types to match new structure
- Migrate any existing config data to new structure

### Backup Orchestration Service
Create a new service that:
- Manages source and destination processor instances
- Implements streaming vs non-streaming workflow detection
- Handles job execution coordination
- Manages cleanup and error handling
- Provides unified progress reporting

### Updated Raw Source Processor
Enhance to support:
- Streaming tar command generation similar to Flash processor
- Include/exclude pattern handling in tar commands
- Metadata flags indicating streaming capability
- Both streaming and direct file path modes

## Testing Strategy

### Unit Tests
- Test each processor independently with mock dependencies
- Validate streaming command generation
- Test error handling and cleanup scenarios
- Verify metadata preservation
- Test config model validation and transformation

### Integration Tests  
- Test complete backup workflows (source → destination)
- Validate streaming vs non-streaming path selection
- Test job management and status tracking
- Verify cleanup coordination
- Test GraphQL API with new config structure

### Edge Cases
- Network failures during streaming uploads
- Source preparation failures with cleanup requirements
- Mixed streaming/non-streaming configurations
- Large file handling and timeout scenarios
- Invalid config combinations

## Success Criteria

### Functional Success
- Flash backups use streaming when appropriate
- Raw backups can use either streaming or non-streaming based on configuration
- Job scheduling and status tracking work correctly
- All backup types execute successfully
- Clean separation of concerns in config structure

### Technical Success
- Clean separation between source and destination concerns
- Consistent error handling and cleanup across all processors
- Efficient streaming for large backups
- Maintainable and extensible processor architecture
- Simplified and logical config structure

### Performance Success
- Streaming backups show improved memory usage for large datasets
- Proper timeout handling prevents hung jobs
- Resource cleanup prevents memory leaks
- Fast execution for both streaming and non-streaming workflows

## Future Considerations

### Additional Source Types
- ZFS snapshot streaming
- Database dump streaming  
- Custom script output streaming
- Docker container backup streaming

### Enhanced Destination Support
- Multiple destination targets
- Destination validation and health checks
- Bandwidth throttling and QoS
- Encryption at destination level

### Monitoring and Observability
- Detailed metrics for streaming vs non-streaming performance
- Progress tracking granularity improvements
- Error categorization and alerting
- Resource usage monitoring per backup type 