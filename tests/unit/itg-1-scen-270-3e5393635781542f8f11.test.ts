import {
  generateNonSubmissionDetectionResult,
  InvalidReporterDataError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-270: 未提出者の中にdepartmentIdが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('InvalidReporterDataErrorが throw され、エラー文言が「未提出者情報に必須項目が不足しています。」であること。処理は中断し、dashboardDisplayData と promptNotificationData は出力されないこと。', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '報告者1',
          emailAddress: 'u001@example.com',
          departmentId: undefined,
        },
      ],
      detectionLog: { nonSubmittedCount: 1 },
      detectionTimestamp: '2024-01-01T09:00:00Z',
    } as any;

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Should have thrown InvalidReporterDataError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(InvalidReporterDataError);
      expect(error.message).toBe('未提出者情報に必須項目が不足しています。');
    }
  });
});
