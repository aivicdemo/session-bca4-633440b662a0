import { generateNonSubmissionDetectionResult, EmptyReporterListError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-266: 未提出者リストが空配列で検知ログの未提出数が0より大きいとき、件数不一致エラーが発生する', () => {
  it('nonSubmittedReporters が空配列で nonSubmittedCount > 0 の場合、EmptyReporterListError がスローされる', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 1,
        submittedCount: 4,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(EmptyReporterListError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(
      '未提出者検知ログと未提出者リストの件数が不一致です。'
    );
  });
});
