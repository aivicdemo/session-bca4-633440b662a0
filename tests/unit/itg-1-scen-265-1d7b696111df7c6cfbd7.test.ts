import { generateNonSubmissionDetectionResult, InvalidDetectionResultError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-265: 検知ログがundefinedのとき、不正な検知結果エラーが発生する', () => {
  it('detectionLog が undefined の場合、InvalidDetectionResultError がスローされる', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          userName: 'テスト太郎',
          emailAddress: 'taro@example.com',
          promptPriority: 'high',
          department: '営業部',
          departmentId: 'dept-001',
        },
      ],
      detectionLog: undefined,
      detectionTimestamp: '2024-01-15T09:00:00Z',
    } as any;

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(InvalidDetectionResultError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(
      '未提出者検知結果が不正です。検知処理を再実行してください。'
    );
  });
});
