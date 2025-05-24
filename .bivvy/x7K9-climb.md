**STARTFILE x7K9-climb.md**
<Climb>
  <header>
    <id>x7K9</id>
    <type>feature</type>
    <description>Enhanced Backup Job Management System with disable/enable controls, manual triggering, and real-time progress monitoring</description>
  </header>
  <newDependencies>No new external dependencies expected - leveraging existing GraphQL subscriptions infrastructure</newDependencies>
  <prerequisiteChanges>None - building on existing backup system architecture</prerequisiteChanges>
  <relevantFiles>
    - web/components/Backup/BackupJobConfig.vue (main UI component)
    - web/components/Backup/backup-jobs.query.ts (GraphQL queries/mutations)
    - api/src/unraid-api/graph/resolvers/backup/backup.resolver.ts (GraphQL resolver)
    - api/src/unraid-api/graph/resolvers/backup/backup-config.service.ts (business logic)
    - api/src/unraid-api/graph/resolvers/backup/backup.model.ts (GraphQL schema types)
  </relevantFiles>
  
  ## Feature Overview
  Enhance the existing backup job management system to provide better control and monitoring capabilities for users managing their backup operations.

  ## Purpose Statement
  Users need granular control over their backup jobs with the ability to enable/disable individual jobs, manually trigger scheduled jobs on-demand, and monitor real-time progress of running backup operations.

  ## Problem Being Solved
  - Users cannot easily disable/enable individual backup jobs without deleting them
  - No way to manually trigger a scheduled backup job outside its schedule
  - No real-time visibility into backup job progress once initiated
  - Limited feedback on current backup operation status

  ## Success Metrics
  - Users can toggle backup jobs on/off without losing configuration
  - Users can manually trigger any configured backup job
  - Real-time progress updates for active backup operations
  - Improved user experience with immediate feedback

  ## Functional Requirements

  ### Job Control
  - Toggle individual backup jobs enabled/disabled state
  - Manual trigger functionality for any configured backup job
  - Preserve all job configuration when disabling
  - Visual indicators for job state (enabled/disabled/running)

  ### Progress Monitoring  
  - Real-time subscription for backup job progress
  - Display progress percentage, speed, ETA, and transferred data
  - Show currently running jobs in the UI
  - Update job status in real-time without page refresh

  ### UI Enhancements
  - Add enable/disable toggle controls to job cards
  - Add "Run Now" button for manual triggering
  - Progress indicators and status updates
  - Better visual feedback for job states

  ## Technical Requirements

  ### GraphQL API
  - Add mutation for enabling/disabling backup job configs
  - Add mutation for manually triggering backup jobs by config ID
  - Add subscription for real-time backup job progress updates
  - Extend existing BackupJob type with progress fields

  ### Backend Services
  - Enhance BackupConfigService with enable/disable functionality
  - Add manual trigger capability that uses existing job configs
  - Implement subscription resolver for real-time updates
  - Ensure proper error handling and status reporting

  ### Frontend Implementation
  - Add toggle controls to BackupJobConfig.vue
  - Implement manual trigger buttons
  - Subscribe to progress updates and display in UI
  - Handle loading states and error conditions

  ## User Flow

  ### Disabling a Job
  1. User views backup job list
  2. User clicks toggle to disable a job
  3. Job status updates immediately
  4. Scheduled execution stops, configuration preserved

  ### Manual Triggering
  1. User clicks "Run Now" on any configured job
  2. System validates job configuration
  3. Backup initiates immediately
  4. User sees real-time progress updates

  ### Progress Monitoring
  1. User initiates backup (scheduled or manual)
  2. Progress subscription automatically activates
  3. Real-time updates show in UI
  4. Completion status updates when job finishes

  ## API Specifications

  ### New Mutations (Nested Pattern)
  Following the established pattern from ArrayMutations, create BackupMutations:
  ```graphql
  type BackupMutations {
    toggleJobConfig(id: String!, enabled: Boolean!): BackupJobConfig
    triggerJob(configId: String!): BackupStatus
  }
  ```

  ### Implementation Structure
  - Create `BackupMutationsResolver` class similar to `ArrayMutationsResolver`
  - Use `@ResolveField()` decorators instead of `@Mutation()`
  - Add appropriate `@UsePermissions()` decorators
  - Group all backup-related mutations under `BackupMutations` type

  ### New Subscription
  ```graphql
  backupJobProgress(jobId: String): BackupJob
  ```

  ### Enhanced Types
  - Extend BackupJob with progress percentage
  - Add jobConfigId reference to running jobs
  - Include more detailed status information

  ### Frontend GraphQL Usage
  ```graphql
  mutation ToggleBackupJob($id: String!, $enabled: Boolean!) {
    backup {
      toggleJobConfig(id: $id, enabled: $enabled) {
        id
        enabled
        updatedAt
      }
    }
  }

  mutation TriggerBackupJob($configId: String!) {
    backup {
      triggerJob(configId: $configId) {
        status
        jobId
      }
    }
  }
  ```

  ## Implementation Considerations

  ### Real-time Updates
  - Use existing GraphQL subscription infrastructure
  - Efficient polling of rclone API for progress data
  - Proper cleanup of subscriptions when jobs complete

  ### State Management
  - Update job configs atomically
  - Handle concurrent operations gracefully
  - Maintain consistency between scheduled and manual executions

  ### Error Handling
  - Validate job configs before manual triggering
  - Graceful degradation if progress updates fail
  - Clear error messages for failed operations

  ## Testing Approach

  ### Test Cases
  - Toggle job enabled/disabled state
  - Manual trigger of backup jobs
  - Real-time progress subscription functionality
  - Error handling for invalid operations
  - Concurrent job execution scenarios

  ### Acceptance Criteria
  - Jobs can be disabled/enabled without data loss
  - Manual triggers work for all valid job configurations
  - Progress updates are accurate and timely
  - UI responds appropriately to all state changes
  - No memory leaks from subscription management

  ## Future Considerations
  - Job scheduling modification (change cron without recreate)
  - Backup job templates and bulk operations
  - Advanced progress details (file-level progress)
  - Job history and logging improvements
</Climb>
**ENDFILE** 