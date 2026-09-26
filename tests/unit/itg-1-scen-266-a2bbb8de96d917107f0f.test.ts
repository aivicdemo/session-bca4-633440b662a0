import {
  generateNonSubmissionDetectionResult,
  EmptyReporterListError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-266: 未提出者リストが空配列で検知ログの未提出数が0より大きいとき、件数不一致エラーが発生する', () => {
  it('EmptyReporterListErrorがスローされ、エラー文言が「未提出者検知ログと未提出者リストの件数が不一致です。」である', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: { nonSubmittedCount: 1, detectionTimestamp: '2024-01-01T09:00:00Z' },
      detectionTimestamp: '2024-01-01T09:00:00Z',
    } as any;

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Should have thrown EmptyReporterListError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(EmptyReporterListError);
      expect(error.message).toBe('未提出者検知ログと未提出者リストの件数が不一致です。');
    }
  });
});
