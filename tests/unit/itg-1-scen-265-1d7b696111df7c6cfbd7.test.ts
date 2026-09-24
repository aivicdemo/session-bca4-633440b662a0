import { describe, it, expect } from '@jest/globals';
import {
  generateNonSubmissionDetectionResult,
  InvalidDetectionResultError,
  type GenerateNonSubmissionDetectionResultInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-265: 検知ログがundefinedのとき、不正な検知結果エラーが発生する', () => {
  it('should throw InvalidDetectionResultError when detectionLog is undefined', () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '報告者1',
          emailAddress: 'u001@example.com',
          departmentId: 'D001',
        },
      ],
      detectionLog: undefined as any,
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
});
