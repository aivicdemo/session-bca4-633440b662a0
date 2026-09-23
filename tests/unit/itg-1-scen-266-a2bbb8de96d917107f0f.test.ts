import {
  generateNonSubmissionDetectionResult,
  EmptyReporterListError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-266: 未提出者リストが空配列で検知ログの未提出数が0より大きいとき、件数不一致エラーが発生する', () => {
  it('未提出者リストが空配列で検知ログに非ゼロの未提出者数が含まれる場合、EmptyReporterListErrorが発生する', async () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-01',
        detectionDateTime: '2024-01-01T09:00:00Z',
        totalReportersCount: 1,
        nonSubmittedCount: 1,
        submittedCount: 0,
      },
      detectionTimestamp: '2024-01-01T09:00:00Z',
    };

    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(EmptyReporterListError);
    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(
      '未提出者検知ログと未提出者リストの件数が不一致です。'
    );
  });
});
