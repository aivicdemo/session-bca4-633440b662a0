import { describe, it, expect } from '@jest/globals';
import {
  generateNonSubmissionDetectionResult,
  InvalidReporterDataError,
  type GenerateNonSubmissionDetectionResultInput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-267: 未提出者の中にuserIdが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('should throw InvalidReporterDataError when userId is missing', () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [
        {
          userId: undefined as any,
          userName: '報告者1',
          emailAddress: 'u001@example.com',
          departmentId: 'D001',
        },
      ],
      detectionLog: {
        nonSubmittedCount: 1,
        detectionTimestamp: '2024-01-15T09:00:00Z',
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Expected InvalidReporterDataError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidReporterDataError);
      expect(error.message).toBe('未提出者情報に必須項目が不足しています。');
    }
  });

  it('should throw InvalidReporterDataError when userName is missing', () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: undefined as any,
          emailAddress: 'u001@example.com',
          departmentId: 'D001',
        },
      ],
      detectionLog: {
        nonSubmittedCount: 1,
        detectionTimestamp: '2024-01-15T09:00:00Z',
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Expected InvalidReporterDataError to be thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidReporterDataError);
      expect(error.message).toBe('未提出者情報に必須項目が不足しています。');
    }
  });
});
