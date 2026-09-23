import {
  generateNonSubmissionDetectionResult,
  InvalidDetectionResultError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-264: 未提出者リストがundefinedのとき、不正な検知結果エラーが発生する', () => {
  it('未提出者リストがundefinedで、検知ログとタイムスタンプが有効な場合、InvalidDetectionResultErrorが発生する', async () => {
    const input = {
      nonSubmittedReporters: undefined as any,
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 1,
        nonSubmittedCount: 1,
        submittedCount: 0,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(InvalidDetectionResultError);
    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(
      '未提出者検知結果が不正です。検知処理を再実行してください。'
    );
  });
});
