import {
  generateNonSubmissionDetectionResult,
  InvalidReporterDataError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-268: 未提出者の中にuserNameが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('未提出者情報から必須フィールド（userName）が欠落している場合、InvalidReporterDataErrorが発生する', async () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          // userName が欠落
          emailAddress: 'reporter1@example.com',
          departmentId: 'dept-001',
          promptPriority: 'high',
        } as any,
      ],
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

    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(InvalidReporterDataError);
    await expect(generateNonSubmissionDetectionResult(input)).rejects.toThrow(
      '未提出者情報に必須項目が不足しています。'
    );
  });
});
