import { generateNonSubmissionDetectionResult, InvalidReporterDataError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-268: 未提出者の中にuserNameが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('nonSubmittedReporters の要素に userName が欠けている場合、InvalidReporterDataError がスローされる', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          // userName が欠けている
          emailAddress: 'taro@example.com',
          promptPriority: 'high',
          department: '営業部',
          departmentId: 'dept-001',
        },
      ],
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 1,
        submittedCount: 4,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    } as any;

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(InvalidReporterDataError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(
      '未提出者情報に必須項目が不足しています。'
    );
  });
});
