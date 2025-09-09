import { describe, expect, it } from 'vitest';

import type { DockerPushMatch } from '@app/unraid-api/graph/resolvers/docker/utils/docker-push-parser.js';
import { parseDockerPushCalls } from '@app/unraid-api/graph/resolvers/docker/utils/docker-push-parser.js';

describe('parseDockerPushCalls', () => {
    it('should extract name and update status from valid docker.push call', () => {
        const jsCode = "docker.push({name:'nginx',update:1});";
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([{ name: 'nginx', updateStatus: 1 }]);
    });

    it('should handle multiple docker.push calls in same string', () => {
        const jsCode = `
            docker.push({name:'nginx',update:1});
            docker.push({name:'mysql',update:0});
            docker.push({name:'redis',update:2});
        `;
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([
            { name: 'nginx', updateStatus: 1 },
            { name: 'mysql', updateStatus: 0 },
            { name: 'redis', updateStatus: 2 },
        ]);
    });

    it('should handle docker.push calls with additional properties', () => {
        const jsCode =
            "docker.push({id:'123',name:'nginx',version:'latest',update:3,status:'running'});";
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([{ name: 'nginx', updateStatus: 3 }]);
    });

    it('should handle different property order', () => {
        const jsCode = "docker.push({update:2,name:'postgres',id:'456'});";
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([{ name: 'postgres', updateStatus: 2 }]);
    });

    it('should handle container names with special characters', () => {
        const jsCode = "docker.push({name:'my-app_v2.0',update:1});";
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([{ name: 'my-app_v2.0', updateStatus: 1 }]);
    });

    it('should handle whitespace variations', () => {
        const jsCode = "docker.push({  name: 'nginx' , update: 1  });";
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([{ name: 'nginx', updateStatus: 1 }]);
    });

    it('should return empty array for empty string', () => {
        const result = parseDockerPushCalls('');
        expect(result).toEqual([]);
    });

    it('should return empty array when no docker.push calls found', () => {
        const jsCode = "console.log('no docker calls here');";
        const result = parseDockerPushCalls(jsCode);
        expect(result).toEqual([]);
    });

    it('should ignore malformed docker.push calls', () => {
        const jsCode = `
            docker.push({name:'valid',update:1});
            docker.push({name:'missing-update'});
            docker.push({update:2});
            docker.push({name:'another-valid',update:0});
        `;
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([
            { name: 'valid', updateStatus: 1 },
            { name: 'another-valid', updateStatus: 0 },
        ]);
    });

    it('should handle all valid update status values', () => {
        const jsCode = `
            docker.push({name:'container0',update:0});
            docker.push({name:'container1',update:1});
            docker.push({name:'container2',update:2});
            docker.push({name:'container3',update:3});
        `;
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([
            { name: 'container0', updateStatus: 0 },
            { name: 'container1', updateStatus: 1 },
            { name: 'container2', updateStatus: 2 },
            { name: 'container3', updateStatus: 3 },
        ]);
    });

    it('should handle real-world example with HTML and multiple containers', () => {
        const jsCode = `
            <div>some html</div>
            docker.push({id:'abc123',name:'plex',version:'1.32',update:1,autostart:true});
            docker.push({id:'def456',name:'nextcloud',version:'latest',update:0,ports:'80:8080'});
            <script>more content</script>
            docker.push({id:'ghi789',name:'homeassistant',update:2});
        `;
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([
            { name: 'plex', updateStatus: 1 },
            { name: 'nextcloud', updateStatus: 0 },
            { name: 'homeassistant', updateStatus: 2 },
        ]);
    });

    it('should handle nested braces in other properties', () => {
        const jsCode = 'docker.push({config:\'{"nested":"value"}\',name:\'test\',update:1});';
        const result = parseDockerPushCalls(jsCode);

        expect(result).toEqual([{ name: 'test', updateStatus: 1 }]);
    });
});
