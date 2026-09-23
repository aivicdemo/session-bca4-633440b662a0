import { generateNonSubmissionDetectionResult, InvalidReporterDataError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-270: departmentIdが欠けている要素があるとき、エラーが発生する', () => {
  it('should throw InvalidReporterDataError when departmentId is missing', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-001',
          userName: 'Test User',
          emailAddress: 'test@example.com',
          departmentId: undefined,
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

  it('should throw InvalidReporterDataError when departmentId is null', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-002',
          userName: 'Another User',
          emailAddress: 'another@example.com',
          departmentId: null,
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

  it('should not output dashboardDisplayData and promptNotificationData when error occurs', () => {
    const input = {
      nonSubmittedReporters: [
        {
          userId: 'user-003',
          userName: 'Third User',
          emailAddress: 'third@example.com',
          departmentId: undefined,
        },
      ],
      detectionLog: {
        detectionLogId: 'log-003',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 8,
        nonSubmittedCount: 1,
        submittedCount: 7,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    expect(() => {
      const result = generateNonSubmissionDetectionResult(input);
      // Should not reach here
      expect(result.dashboardDisplayData).toBeUndefined();
      expect(result.promptNotificationData).toBeUndefined();
    }).toThrow(InvalidReporterDataError);
  });
});
