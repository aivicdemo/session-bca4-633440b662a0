import {
  generateNonSubmissionDetectionResult,
  InvalidReporterDataError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-268: 未提出者の中にuserNameが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('InvalidReporterDataErrorが発生し、エラー文言『未提出者情報に必須項目が不足しています。』が返される。', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: undefined,
          emailAddress: 'u001@example.com',
          departmentId: 'D001',
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
