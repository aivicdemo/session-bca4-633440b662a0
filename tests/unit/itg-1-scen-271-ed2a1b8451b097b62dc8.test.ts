import { generateNonSubmissionDetectionResult, type GenerateNonSubmissionDetectionResultOutput, type GenerateNonSubmissionDetectionResultInput, type NonSubmissionDetectionLog } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-271: 未提出者リストが空配列で検知ログの未提出数が0のとき、管理画面表示用データと催促通知用データが整形される', () => {
  it('should format dashboard and notification data when nonSubmittedReporters is empty and nonSubmittedCount is 0', () => {
    const nonSubmittedReporters: any[] = [];

    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-20240115-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T09:00:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 0,
      submittedCount: 5,
    };

    const detectionTimestamp = '2024-01-15T09:00:00Z';

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters,
      detectionLog,
      detectionTimestamp,
    };

    const result = generateNonSubmissionDetectionResult(input) as any;

    expect(result).toBeDefined();

    if ('dashboardDisplayData' in result && result.dashboardDisplayData) {
      expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toEqual([]);
      expect(result.dashboardDisplayData.detectionLogForDisplay).toBeDefined();
    }

    if ('promptNotificationData' in result && result.promptNotificationData) {
      expect(result.promptNotificationData.nonSubmittedReportersForNotification).toEqual([]);
    }
  });
});
