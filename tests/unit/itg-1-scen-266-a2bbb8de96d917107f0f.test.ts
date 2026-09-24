import { describe, it, expect } from '@jest/globals';
import {
  generateNonSubmissionDetectionResult,
  EmptyReporterListError,
  type GenerateNonSubmissionDetectionResultInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-266: 未提出者リストが空配列で検知ログの未提出数が0より大きいとき、件数不一致エラーが発生する', () => {
  it('should throw EmptyReporterListError when nonSubmittedReporters is empty but nonSubmittedCount > 0', () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [],
      detectionLog: {
        nonSubmittedCount: 1,
        detectionTimestamp: '2024-01-01T09:00:00Z',
      },
      detectionTimestamp: '2024-01-01T09:00:00Z',
    };

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Expected EmptyReporterListError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(EmptyReporterListError);
      expect(error.message).toBe('未提出者検知ログと未提出者リストの件数が不一致です。');
    }
  });
});
