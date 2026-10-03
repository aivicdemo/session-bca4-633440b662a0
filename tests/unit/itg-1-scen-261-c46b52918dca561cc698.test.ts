import { generateNonSubmissionDetectionResult } from '../../src/logic/daily-report-non-submission-detection';
import type { GenerateNonSubmissionDetectionResultInput, NonSubmissionDetectionLog } from '../../src/logic/daily-report-non-submission-detection';
import type { NonSubmittedReporter } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-261: 未提出者リストと検知ログが正常に提供されたとき、管理画面表示用データと催促通知用データが整形される', () => {
  it('検知結果を管理画面表示用と催促通知用に整形して返す', async () => {
    const nonSubmittedReporters: NonSubmittedReporter[] = [
      { userId: 'user-001', userName: '太郎', emailAddress: 'taro@example.com', department: '営業部', promptPriority: 'high' },
      { userId: 'user-002', userName: '花子', emailAddress: 'hanako@example.com', department: '企画部', promptPriority: 'high' },
      { userId: 'user-003', userName: '次郎', emailAddress: 'jiro@example.com', department: '営業部', promptPriority: 'medium' },
    ];

    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:00:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 3,
      submittedCount: 2,
    };

    const detectionTimestamp = '2024-01-15T17:00:00Z';

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters,
      detectionLog,
      detectionTimestamp,
    };

    const result = await generateNonSubmissionDetectionResult(input);

    expect(result.dashboardDisplayData).toBeDefined();
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toHaveLength(3);
    expect(result.dashboardDisplayData.detectionLogForDisplay).toBeDefined();
    expect(result.dashboardDisplayData.summaryStatistics).toBeDefined();

    expect(result.dashboardDisplayData.detectionLogForDisplay.detectionDateTime).toBe('2024-01-15T17:00:00Z');
    expect(result.dashboardDisplayData.detectionLogForDisplay.targetDate).toBe('2024-01-15');
    expect(result.dashboardDisplayData.detectionLogForDisplay.totalReportersCount).toBe(5);
    expect(result.dashboardDisplayData.detectionLogForDisplay.nonSubmittedCount).toBe(3);

    expect(result.promptNotificationData).toBeDefined();
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toHaveLength(3);
    expect(result.promptNotificationData.notificationContext).toBeDefined();
    expect(result.promptNotificationData.notificationContext.targetDate).toBe('2024-01-15');
    expect(result.promptNotificationData.notificationContext.detectionTimestamp).toBe('2024-01-15T17:00:00Z');

    const displayReporters = result.dashboardDisplayData.nonSubmittedReportersForDisplay;
    expect(displayReporters[0].userId).toBe('user-001');
    expect(displayReporters[0].userName).toBe('太郎');
    expect(displayReporters[0].emailAddress).toBe('taro@example.com');

    const notificationReporters = result.promptNotificationData.nonSubmittedReportersForNotification;
    expect(notificationReporters[0].userId).toBe('user-001');
    expect(notificationReporters[0].userName).toBe('太郎');
    expect(notificationReporters[0].emailAddress).toBe('taro@example.com');
  });
});
