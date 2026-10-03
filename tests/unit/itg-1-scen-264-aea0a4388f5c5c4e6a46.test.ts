import { generateNonSubmissionDetectionResult, InvalidDetectionResultError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-264: 未提出者リストがundefinedのとき、不正な検知結果エラーが発生する', () => {
  it('nonSubmittedReporters が undefined の場合、InvalidDetectionResultError がスローされる', () => {
    const input = {
      nonSubmittedReporters: undefined,
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

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(InvalidDetectionResultError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(
      '未提出者検知結果が不正です。検知処理を再実行してください。'
    );
  });
});
