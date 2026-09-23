import { generateNonSubmissionDetectionResult, InvalidReporterDataError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-269: emailAddressが欠けている要素があるとき、エラーが発生する', () => {
  it('should throw InvalidReporterDataError when emailAddress is undefined', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          userName: 'Test User',
          emailAddress: undefined,
          departmentId: 'dept-001',
        },
      ],
      detectionLog: {
        detectionLogId: 'log-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 10,
        nonSubmittedCount: 1,
        submittedCount: 9,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(InvalidReporterDataError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow('未提出者情報に必須項目が不足しています。');
  });

  it('should throw InvalidReporterDataError when emailAddress is null', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-002',
          userName: 'Another User',
          emailAddress: null,
          departmentId: 'dept-002',
        },
      ],
      detectionLog: {
        detectionLogId: 'log-002',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 1,
        submittedCount: 4,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    expect(() => generateNonSubmissionDetectionResult(input)).toThrow(InvalidReporterDataError);
    expect(() => generateNonSubmissionDetectionResult(input)).toThrow('未提出者情報に必須項目が不足しています。');
  });
});
