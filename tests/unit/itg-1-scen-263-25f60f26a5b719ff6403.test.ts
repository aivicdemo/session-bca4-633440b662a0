import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  InvalidDetectionResultError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-263: 検知ログがnullのとき、不正な検知結果エラーが発生する', () => {
  it('detectionLog が null のとき、InvalidDetectionResultError が発生し、エラーメッセージが正確である', async () => {
    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [
        {
          userId: 'reporter-001',
          name: 'Reporter One',
          email: 'reporter-001@example.com',
          department: 'Engineering',
        },
      ],
      detectionLog: null as any,
      detectionTimestamp: '2024-01-15T17:00:00Z',
    };

    const error = await generateNonSubmissionDetectionResult(input).catch((e) => e);

    expect(error).toBeInstanceOf(InvalidDetectionResultError);
    expect(error.message).toBe('未提出者検知結果が不正です。検知処理を再実行してください。');
  });
});
