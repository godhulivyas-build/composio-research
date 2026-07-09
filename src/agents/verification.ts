/**
 * Verification Agent
 *
 * Independently verifies research findings against documentation.
 * Marks each finding as PASS, FAIL, or MANUAL_REVIEW.
 */

import pino from 'pino';

import { Environment } from '../config/env.js';
import { getChildLogger } from '../config/logger.js';
import { ResearchFinding, VerificationFindingSchema, VerificationFinding } from '../models/index.js';
import { VerificationError } from '../utils/errors.js';
import { retryAsync } from '../utils/async.js';
import { inferenceVerify } from '../utils/inference.js';

export interface VerificationAgentOptions {
  maxRetries?: number;
  model?: string;
}

/**
 * Verification Agent that validates research findings
 */
export class VerificationAgent {
  private logger: pino.Logger;
  private options: Required<VerificationAgentOptions>;

  constructor(
    _env: Environment,
    logger: pino.Logger,
    options?: VerificationAgentOptions
  ) {
    // No external API key required - using local inference
    this.logger = getChildLogger(logger, 'verification-agent');
    this.options = {
      maxRetries: options?.maxRetries ?? 1,
      model: options?.model ?? 'local-inference',
    };
  }

  /**
   * Verify a single research finding
   * Checks if findings match evidence and documentation
   */
  async verify(finding: ResearchFinding): Promise<VerificationFinding> {
    this.logger.info({ appName: finding.appName }, 'Starting verification');

    try {
      const verification = await retryAsync(
        () => this.performVerification(finding),
        {
          maxAttempts: this.options.maxRetries,
        }
      );

      this.logger.info(
        {
          appName: finding.appName,
          passRate: verification.passRate,
        },
        'Verification completed'
      );

      return verification;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown verification error';
      this.logger.error(
        { appName: finding.appName, error: message },
        'Verification failed'
      );
      throw new VerificationError(
        `Failed to verify ${finding.appName}: ${message}`,
        finding.appName,
        error
      );
    }
  }

  /**
   * Perform verification using Claude
   * Validate that research findings are supported by evidence
   */
  private async performVerification(
    finding: ResearchFinding
  ): Promise<VerificationFinding> {
    // Use local inference (completely free, no API calls)
    const parsedResponse = await inferenceVerify(
      finding.appName,
      {
        authMethods: finding.authMethods,
        apiType: finding.apiType,
        selfServe: finding.selfServe,
      },
      finding.evidenceUrls
    );

    // Validate against schema
    const verified = VerificationFindingSchema.parse({
      appName: finding.appName,
      ...parsedResponse,
      timestamp: new Date().toISOString(),
    });

    return verified;
  }

  /**
   * Verify multiple findings in sequence
   */
  async verifyBatch(findings: ResearchFinding[]): Promise<VerificationFinding[]> {
    const results: VerificationFinding[] = [];

    for (let i = 0; i < findings.length; i++) {
      const finding = findings[i];
      if (!finding) continue;

      this.logger.info(
        { appName: finding.appName, progress: `${i + 1}/${findings.length}` },
        'Verifying application'
      );

      try {
        const verification = await this.verify(finding);
        results.push(verification);
      } catch (error) {
        this.logger.error(
          { appName: finding.appName },
          'Verification failed, creating unknown verification'
        );
        // Create unknown verification
        results.push(
          VerificationFindingSchema.parse({
            appName: finding.appName,
            verificationsPassed: 0,
            verificationsTotal: 0,
            passRate: 0,
            results: [],
            flaggedForReview: true,
            reviewReason: 'Verification agent failed',
            timestamp: new Date().toISOString(),
          })
        );
      }
    }

    return results;
  }
}
