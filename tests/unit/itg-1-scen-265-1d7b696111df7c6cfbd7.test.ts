import {
  generateNonSubmissionDetectionResult,
  InvalidReporterDataError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-265: 検知ログがundefinedのとき、エラーが発生する', () => {
  it('detectionLog が undefined のときエラーが発生する', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'U001',
          userName: '報告者1',
          emailAddress: 'u001@example.com',
          departmentId: 'D001',
        },
      ],
      detectionLog: undefined,
      detectionTimestamp: '2024-01-01T09:00:00Z',
    } as any;

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow();
  });
});
