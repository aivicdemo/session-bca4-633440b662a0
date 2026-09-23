import { jest } from '@jest/globals';
import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  GenerateNonSubmissionDetectionResultOutput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-261: generateNonSubmissionDetectionResult - 管理画面表示用と催促通知用データの整形', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未提出者リストと検知ログから管理画面表示用と催促通知用データを整形する', async () => {
    const targetDate = '2024-01-15';
    const detectionTimestamp = '2024-01-15T17:00:00Z';

    const mockNonSubmittedReporters = [
      {
        userId: 'reporter-001',
        userName: '報告者1',
        emailAddress: 'reporter-001@example.com',
        departmentId: 'dept-001',
      },
      {
        userId: 'reporter-002',
        userName: '報告者2',
        emailAddress: 'reporter-002@example.com',
        departmentId: 'dept-002',
      },
      {
        userId: 'reporter-003',
        userName: '報告者3',
        emailAddress: 'reporter-003@example.com',
        departmentId: 'dept-001',
      },
    ];

    const mockDetectionLog = {
      detectionLogId: 'log-001',
      targetDate,
      detectionDateTime: detectionTimestamp,
      totalReportersCount: 10,
      nonSubmittedCount: 3,
      submittedCount: 7,
    };

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: mockNonSubmittedReporters,
      detectionLog: mockDetectionLog,
      detectionTimestamp,
    };

    const result: GenerateNonSubmissionDetectionResultOutput =
      await generateNonSubmissionDetectionResult(input);

    // dashboardDisplayData の確認
    expect(result.dashboardDisplayData).toBeDefined();
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toHaveLength(3);
    expect(result.dashboardDisplayData.detectionLogForDisplay).toBeDefined();
    expect(result.dashboardDisplayData.detectionLogForDisplay.detectionDateTime).toBe(
      detectionTimestamp,
    );
    expect(result.dashboardDisplayData.summaryStatistics).toBeDefined();

    // promptNotificationData の確認
    expect(result.promptNotificationData).toBeDefined();
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toHaveLength(3);
    expect(result.promptNotificationData.notificationContext).toBeDefined();

    // dashboardDisplayData の未提出者リストが3件を含む
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-001',
        userName: '報告者1',
        emailAddress: 'reporter-001@example.com',
      }),
    );
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-002',
        userName: '報告者2',
        emailAddress: 'reporter-002@example.com',
      }),
    );
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-003',
        userName: '報告者3',
        emailAddress: 'reporter-003@example.com',
      }),
    );

    // promptNotificationData の未提出者リストが3件を含む
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-001',
        emailAddress: 'reporter-001@example.com',
        userName: '報告者1',
      }),
    );
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-002',
        emailAddress: 'reporter-002@example.com',
        userName: '報告者2',
      }),
    );
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toContainEqual(
      expect.objectContaining({
        userId: 'reporter-003',
        emailAddress: 'reporter-003@example.com',
        userName: '報告者3',
      }),
    );
  });
});
