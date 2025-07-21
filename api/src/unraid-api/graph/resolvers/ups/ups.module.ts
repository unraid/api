import { Module } from '@nestjs/common';
import { UPSResolver } from './ups.resolver';
import { UPSService } from './ups.service';

@Module({
  providers: [UPSResolver, UPSService],
})
export class UPSModule {}
