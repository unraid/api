import {
    Controller,
    Get,
} from '@nestjs/common';

@Controller()
export class RestController {

    @Get('/')
    async getRoot() {
        return 'Hello World!';
    }

    @Get('/test')
    async getTest() {
        return 'Hello World!';
    }
}
