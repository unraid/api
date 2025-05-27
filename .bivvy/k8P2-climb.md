**STARTFILE k8P2-climb.md**
<Climb>
  <header>
    <id>k8P2</id>
    <type>bug</type>
    <description>Fix RClone backup jobs not appearing in jobs list and missing status data</description>
  </header>
  <newDependencies>None - this is a bug fix for existing functionality</newDependencies>
  <prerequisitChanges>None - working with existing backup service implementation</prerequisitChanges>
  <relevantFiles>
    - api/src/unraid-api/graph/resolvers/rclone/rclone-api.service.ts (main RClone API service)
    - api/src/unraid-api/graph/resolvers/backup/backup-mutations.resolver.ts (backup mutations)
    - web/components/Backup/BackupOverview.vue (frontend backup overview)
    - web/components/Backup/backup-jobs.query.ts (GraphQL query for jobs)
    - api/src/unraid-api/graph/resolvers/backup/backup-queries.resolver.ts (backup queries resolver)
  </relevantFiles>
  <everythingElse>
## Problem Statement

The newly implemented backup service has two critical issues:
1. **Jobs not appearing in non-system jobs list**: When users trigger backup jobs via the "Run Now" button in BackupOverview.vue, these jobs are not showing up in the jobs list query, even when `showSystemJobs: false`
2. **Missing job status data**: Jobs that are started don't return proper status information, making it impossible to track backup progress

## Background

This issue emerged immediately after implementing the new backup service. The backup functionality uses:
- RClone RC daemon for job execution via Unix socket
- GraphQL mutations for triggering backups (`triggerJob`, `initiateBackup`)
- Job grouping system with groups like `backup/manual` and `backup/${id}`
- Vue.js frontend with real-time job status monitoring

## Root Cause Analysis Areas

### 1. Job Group Classification
The current implementation sets job groups as:
- `backup/manual` for manual backups
- `backup/${id}` for configured job backups

**Potential Issue**: The jobs query may be filtering these groups incorrectly, classifying user-initiated backups as "system jobs"

### 2. RClone API Response Handling
**Potential Issue**: The `startBackup` method may not be properly handling or returning job metadata from RClone RC API responses

### 3. Job Status Synchronization
**Potential Issue**: There may be a disconnect between job initiation and the jobs listing/status APIs

### 4. Logging Deficiency
**Current Gap**: Insufficient logging around RClone API responses makes debugging difficult

## Technical Requirements

### Enhanced Logging
- Add comprehensive debug logging for all RClone API calls and responses
- Log job initiation parameters and returned job metadata
- Log job listing and filtering logic
- Add structured logging for job group classification

### Job Classification Fix
- Ensure user-initiated backup jobs are properly classified as non-system jobs
- Review and fix job group filtering logic in the jobs query resolver
- Validate that job groups `backup/manual` and `backup/${id}` are treated as non-system

### Status Data Flow
- Verify job ID propagation from RClone startBackup response
- Ensure job status API correctly retrieves and formats status data
- Fix any data transformation issues between RClone API and GraphQL responses

### Data Model Consistency
- Ensure BackupJob GraphQL type includes all necessary fields (note: current linter error shows missing 'type' field)
- Verify job data structure consistency between API and frontend

## Acceptance Criteria

### Primary Fixes
1. **Jobs Visibility**: User-triggered backup jobs appear in the jobs list when `showSystemJobs: false`
2. **Status Data**: Job status data (progress, speed, ETA, etc.) is properly retrieved and displayed
3. **Job ID Tracking**: Job IDs are properly returned and can be used for status queries

### Secondary Improvements
4. **Enhanced Logging**: Comprehensive logging for debugging RClone interactions
5. **Type Safety**: Fix TypeScript/linting errors in BackupOverview.vue
6. **System Jobs Investigation**: Document findings about excessive system jobs

## Testing Approach

### Manual Testing
1. Trigger backup via "Run Now" button in BackupOverview.vue
2. Verify job appears in running jobs list (with showSystemJobs: false)
3. Confirm job status data displays correctly (progress, speed, etc.)
4. Test both `triggerJob` (configured jobs) and `initiateBackup` (manual jobs) flows

### API Testing
1. Verify RClone API responses contain expected job metadata
2. Test job listing API with various group filters
3. Validate job status API returns complete data

### Edge Cases
1. Test behavior when RClone daemon is restarted
2. Test concurrent backup jobs
3. Test backup job cancellation/completion scenarios

## Implementation Strategy

### Phase 1: Debugging & Logging
- Add comprehensive logging to RClone API service
- Log all API responses and job metadata
- Add logging to job filtering logic

### Phase 2: Job Classification Fix
- Fix job group filtering in backup queries resolver
- Ensure proper non-system job classification
- Test job visibility in frontend

### Phase 3: Status Data Fix
- Fix job status data retrieval and formatting
- Ensure complete job metadata is available
- Fix TypeScript/GraphQL type issues

### Phase 4: Validation & Testing
- Comprehensive testing of backup job lifecycle
- Validate all acceptance criteria
- Document system jobs investigation findings

## Security Considerations
- Ensure logging doesn't expose sensitive backup configuration data
- Maintain proper authentication/authorization for backup operations
- Validate that job status queries don't leak information between users

## Performance Considerations
- Ensure logging doesn't significantly impact performance
- Optimize job listing queries if necessary
- Consider caching strategies for frequently accessed job data

## Known Constraints
- Must work with existing RClone RC daemon setup
- Cannot break existing backup functionality during fixes
- Must maintain backward compatibility with existing backup configurations
</Climb>
**ENDFILE** 