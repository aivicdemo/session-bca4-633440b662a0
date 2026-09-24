import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  GenerateNonSubmissionDetectionResultOutput,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-261: 未提出者リストと検知ログが正常に提供されたとき、管理画面表示用データと催促通知用データが整形される', () => {
  it('未提出者リストと検知ログから管理画面表示用と催促通知用データを整形する', async () => {
    const targetDate = '2024-01-15';
    const detectionTimestamp = '2024-01-15T17:00:00Z';

    const mockNonSubmittedReporters = [
      {
        userId: 'reporter-001',
        name: 'Reporter One',
        email: 'reporter-001@example.com',
        department: 'Engineering',
      },
      {
        userId: 'reporter-002',
        name: 'Reporter Two',
        email: 'reporter-002@example.com',
        department: 'Sales',
      },
      {
        userId: 'reporter-003',
        name: 'Reporter Three',
        email: 'reporter-003@example.com',
        department: 'Engineering',
      },
    ];

    const mockDetectionLog = {
      detectionLogId: 'log-001',
      targetDate,
      detectionDateTime: detectionTimestamp,
      targetCount: 10,
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

    // dashboardDisplayData が存在し、整形済みの未提出者情報と検知ログを含むオブジェクトであることを確認
    expect(result.dashboardDisplayData).toBeDefined();
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toHaveLength(3);
    expect(result.dashboardDisplayData.detectionLogForDisplay).toBeDefined();

    // dashboardDisplayData に含まれる検知ログのタイムスタンプが入力の detectionTimestamp と一致することを確認
    expect(result.dashboardDisplayData.detectionLogForDisplay.detectionDateTime).toBe(
      detectionTimestamp,
    );

    // promptNotificationData が存在し、催促通知送信に必要な未提出者情報と通知対象者リストを含むオブジェクトであることを確認
    expect(result.promptNotificationData).toBeDefined();
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toHaveLength(3);
    expect(result.promptNotificationData.notificationContext).toBeDefined();

    // dashboardDisplayData に含まれる未提出者情報が3件のレコード
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toContainEqual(
      expect.objectContaining({ userId: 'reporter-001' }),
    );
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toContainEqual(
      expect.objectContaining({ userId: 'reporter-002' }),
    );
    expect(result.dashboardDisplayData.nonSubmittedReportersForDisplay).toContainEqual(
      expect.objectContaining({ userId: 'reporter-003' }),
    );

    // promptNotificationData に含まれる通知対象者リストが、入力された nonSubmittedReporters に対応する配列
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toContainEqual(
      expect.objectContaining({ userId: 'reporter-001' }),
    );
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toContainEqual(
      expect.objectContaining({ userId: 'reporter-002' }),
    );
    expect(result.promptNotificationData.nonSubmittedReportersForNotification).toContainEqual(
      expect.objectContaining({ userId: 'reporter-003' }),
    );
  });
});
