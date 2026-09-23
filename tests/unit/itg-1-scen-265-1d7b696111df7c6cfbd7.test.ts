import {
  generateNonSubmissionDetectionResult,
  InvalidDetectionResultError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-265: 検知ログがundefinedのとき、不正な検知結果エラーが発生する', () => {
  it('検知ログがundefinedで、未提出者リストとタイムスタンプが有効な場合、InvalidDetectionResultErrorが発生する', async () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          userName: '報告者1',
          emailAddress: 'reporter1@example.com',
          departmentId: 'dept-001',
          promptPriority: 'high',
        },
      ],
      detectionLog: undefined as any,
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(InvalidDetectionResultError);
    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(
      '未提出者検知結果が不正です。検知処理を再実行してください。'
    );
  });
});
