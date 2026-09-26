import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  InvalidDetectionResultError,
  NonSubmissionDetectionLog,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-262: 未提出者リストがnullのとき、不正な検知結果エラーが発生する', () => {
  it('nonSubmittedReporters が null のとき、InvalidDetectionResultError が発生し、エラー文言が正確である', () => {
    const mockDetectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:00:00Z',
      totalReportersCount: 1,
      nonSubmittedCount: 1,
      submittedCount: 0,
    };

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: null as any,
      detectionLog: mockDetectionLog,
      detectionTimestamp: '2024-01-15T17:00:00Z',
    };

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow(InvalidDetectionResultError);

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Should have thrown InvalidDetectionResultError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDetectionResultError);
      expect((error as InvalidDetectionResultError).message).toBe(
        '未提出者検知結果が不正です。検知処理を再実行してください。'
      );
    }
  });
});
