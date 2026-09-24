import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  InvalidDetectionResultError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-262: 未提出者リストがnullのとき、不正な検知結果エラーが発生する', () => {
  it('nonSubmittedReporters が null のとき、InvalidDetectionResultError が発生し、エラー文言が正確である', async () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: null as any,
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T17:00:00Z',
        targetCount: 1,
        nonSubmittedCount: 1,
      },
      detectionTimestamp: '2024-01-15T17:00:00Z',
    };

    const error = await generateNonSubmissionDetectionResult(input).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidDetectionResultError);
    expect(error.message).toBe('未提出者検知結果が不正です。検知処理を再実行してください。');
  });
});
