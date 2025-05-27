import { Module } from '@nestjs/common';

import { StreamingJobManager } from '@app/unraid-api/streaming-jobs/streaming-job-manager.service.js';

@Module({
    providers: [StreamingJobManager],
    exports: [StreamingJobManager],
})
export class StreamingJobsModule {}
