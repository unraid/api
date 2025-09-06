import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { defineEventHandler, readBody } from 'h3';

const execAsync = promisify(exec);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token } = body;

  if (!token) {
    return {
      error: 'Token is required',
      success: false,
    };
  }

  try {
    // Execute the Unraid API CLI command using command:raw to avoid build output
    const cliCommand = `cd ../api && pnpm command sso validate-token "${token}" 2>&1`;
    const { stdout, stderr } = await execAsync(cliCommand, {
      timeout: 30000,
      env: { ...process.env, NODE_ENV: 'production' }, // Suppress debug output
    });

    // Extract JSON from the output (last line that looks like JSON)
    const lines = stdout.trim().split('\n');
    let parsedOutput = null;

    // Look for JSON output from the end
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          parsedOutput = JSON.parse(line);
          break;
        } catch {
          // Continue looking
        }
      }
    }

    if (!parsedOutput) {
      parsedOutput = stdout;
    }

    return {
      success: true,
      stdout: parsedOutput,
      stderr,
      timestamp: new Date().toISOString(),
    };
  } catch (execError) {
    // Extract JSON from error output
    const error = execError as { stdout?: string; stderr?: string; message?: string };
    const output = error.stdout || '';
    const lines = output.trim().split('\n');
    let parsedOutput = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          parsedOutput = JSON.parse(line);
          break;
        } catch {
          // Continue looking
        }
      }
    }

    if (!parsedOutput) {
      parsedOutput = output;
    }

    return {
      success: false,
      error: error.message || 'Command failed',
      stdout: parsedOutput,
      stderr: error.stderr || '',
      timestamp: new Date().toISOString(),
    };
  }
});
