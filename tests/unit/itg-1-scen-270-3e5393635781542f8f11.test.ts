import { generateNonSubmissionDetectionResult, InvalidReporterDataError, type GenerateNonSubmissionDetectionResultInput, type NonSubmissionDetectionLog } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-270: 未提出者の中にdepartmentIdが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('should throw InvalidReporterDataError when departmentId is missing from a nonSubmittedReporter', () => {
    const nonSubmittedReporters: any[] = [
      {
        userId: 'user-001',
        userName: '山田太郎',
        emailAddress: 'yamada@example.com',
        // departmentId is intentionally omitted
      },
    ];

    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-20240115-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T09:00:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 1,
      submittedCount: 4,
    };

    const detectionTimestamp = '2024-01-15T09:00:00Z';

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters,
      detectionLog,
      detectionTimestamp,
    };

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(InvalidReporterDataError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow('未提出者情報に必須項目が不足しています。');
  });
});
