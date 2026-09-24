import { describe, it, expect } from '@jest/globals';
import {
  generateNonSubmissionDetectionResult,
  InvalidDetectionResultError,
  type GenerateNonSubmissionDetectionResultInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-264: 未提出者リストがundefinedのとき、不正な検知結果エラーが発生する', () => {
  it('should throw InvalidDetectionResultError when nonSubmittedReporters is undefined', () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: undefined as any,
      detectionLog: {
        nonSubmittedCount: 1,
        detectionTimestamp: '2024-01-15T09:00:00Z',
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Expected InvalidDetectionResultError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidDetectionResultError);
      expect(error.message).toBe('未提出者検知結果が不正です。検知処理を再実行してください。');
    }
  });

  it('should not return dashboardDisplayData when error is thrown', () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: undefined as any,
      detectionLog: {
        nonSubmittedCount: 1,
        detectionTimestamp: '2024-01-15T09:00:00Z',
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Expected InvalidDetectionResultError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDetectionResultError);
    }
  });
});
