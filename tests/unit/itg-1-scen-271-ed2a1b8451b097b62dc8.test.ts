import { generateNonSubmissionDetectionResult } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-271: 未提出者リストが空配列で検知ログの未提出数が0のとき、データが整形される', () => {
  it('should return formatted data when nonSubmittedReporters is empty and nonSubmittedCount is 0', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-empty',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 10,
        nonSubmittedCount: 0,
        submittedCount: 10,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    const result = generateNonSubmissionDetectionResult(input);

    expect(result).toBeDefined();
    expect(result.dashboardDisplayData).toBeDefined();
    expect(result.promptNotificationData).toBeDefined();
  });

  it('should have empty nonSubmittedReportersForDisplay in dashboardDisplayData', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-empty-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 5,
        nonSubmittedCount: 0,
        submittedCount: 5,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    const result = generateNonSubmissionDetectionResult(input);

    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toEqual([]);
  });

  it('should have properly formatted detectionLogForDisplay in dashboardDisplayData', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-empty-002',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 20,
        nonSubmittedCount: 0,
        submittedCount: 20,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    const result = generateNonSubmissionDetectionResult(input);

    expect(result.dashboardDisplayData.detectionLogForDisplay).toBeDefined();
    expect(result.dashboardDisplayData.detectionLogForDisplay.nonSubmittedCount).toBe(0);
    expect(result.dashboardDisplayData.detectionLogForDisplay.totalReportersCount).toBe(20);
    expect(result.dashboardDisplayData.detectionLogForDisplay.submittedCount).toBe(20);
  });

  it('should have empty nonSubmittedReportersForNotification in promptNotificationData', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-empty-003',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 15,
        nonSubmittedCount: 0,
        submittedCount: 15,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    const result = generateNonSubmissionDetectionResult(input);

    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toEqual([]);
  });

  it('should not throw error when processing empty list', () => {
    const input = {
      nonSubmittedReporters: [],
      detectionLog: {
        detectionLogId: 'log-empty-004',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:00:00Z',
        totalReportersCount: 7,
        nonSubmittedCount: 0,
        submittedCount: 7,
      },
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).not.toThrow();
  });
});
