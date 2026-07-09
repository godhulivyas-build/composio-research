import { spawn } from 'child_process';
import { resolve as resolvePath } from 'path';

/**
 * Local inference wrapper - calls Python for LLM tasks
 * Completely free - no API keys required
 */
export async function inferenceExtractFromDocs(
  appName: string,
  documentation: string
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const scriptPath = resolvePath('./scripts/llm_inference.py');
    const childProcess = spawn('python', [scriptPath, 'research', appName], {
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as any;

    let output = '';
    let error = '';

    childProcess.stdout.on('data', (data: any) => {
      output += data.toString();
    });

    childProcess.stderr.on('data', (data: any) => {
      error += data.toString();
    });

    childProcess.on('close', (code: any) => {
      if (code !== 0) {
        reject(new Error(`Inference failed: ${error}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse inference output: ${output}`));
      }
    });

    childProcess.stdin.write(documentation);
    childProcess.stdin.end();
  });
}

export async function inferenceVerify(
  appName: string,
  finding: Record<string, unknown>,
  evidenceUrls: Array<{ url: string; claim: string; title?: string }>
): Promise<Record<string, unknown>> {
  return new Promise((verifyResolve, verifyReject) => {
    const scriptPath = resolvePath('./scripts/llm_inference.py');
    const childProcess = spawn('python', [scriptPath, 'verify', appName], {
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as any;

    let output = '';
    let error = '';

    childProcess.stdout.on('data', (data: any) => {
      output += data.toString();
    });

    childProcess.stderr.on('data', (data: any) => {
      error += data.toString();
    });

    childProcess.on('close', (code: any) => {
      if (code !== 0) {
        verifyReject(new Error(`Verification failed: ${error}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        verifyResolve(result);
      } catch (e) {
        verifyReject(new Error(`Failed to parse verification output: ${output}`));
      }
    });

    const inputData = JSON.stringify({
      finding,
      evidence_urls: evidenceUrls,
    });

    childProcess.stdin.write(inputData);
    childProcess.stdin.end();
  });
}
