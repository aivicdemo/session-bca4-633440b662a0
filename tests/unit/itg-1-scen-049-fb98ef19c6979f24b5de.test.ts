import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';
import * as nonSubmissionDetectionModule from '../../src/logic/daily-report-non-submission-detection';
import * as promptDecisionModule from '../../src/logic/non-submission-prompt-decision';
import * as reminderNotificationModule from '../../src/logic/daily-report-reminder-notification';
import * as emailNotificationModule from '../../src/logic/email-notification-management';
import * as dashboardModule from '../../src/logic/daily-report-management-view';

describe('SCEN-049: 報告者マスタの人事異動による更新が反映されていない場合でも、現在有効な報告者のみを対象として処理される', () => {
  const mockAiClient: Tx4Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('非営業日エラーで第1呼び出しが失敗し、第2呼び出しで成功することを確認する', async () => {
    const targetDateNotBusinessDay = '2024-01-13'; // 土曜日
    const targetDateBusinessDay = '2024-01-15'; // 営業日
    const leaderUserId = 'leader-001';
    const teamId = 'team-001';

    // 有効な報告者: ユーザーA、B、D
    const activeReporters = [
      { reporterId: 'reporter-a', userId: 'user-a', reporterName: 'ユーザーA', emailAddress: 'a@example.com', department: 'dept-1', status: 'active' },
      { reporterId: 'reporter-b', userId: 'user-b', reporterName: 'ユーザーB', emailAddress: 'b@example.com', department: 'dept-1', status: 'active' },
      { reporterId: 'reporter-d', userId: 'user-d', reporterName: 'ユーザーD', emailAddress: 'd@example.com', department: 'dept-1', status: 'active' },
    ];

    // ===== 第1呼び出し: 非営業日エラー =====
    const targetDateNotBusinessDayError = new Error('【業務日判定エラー】対象日が営業日ではないため処理を実行できません。');
    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockRejectedValueOnce(targetDateNotBusinessDayError);

    const firstResult = await runTx4Imp1Agent(
      {
        targetDate: targetDateNotBusinessDay,
        leaderUserId,
        teamId,
      },
      mockAiClient
    );

    expect(firstResult.executionStatus).toBe('failure');
    expect(firstResult.errors).toBeDefined();
    expect(firstResult.errors).toHaveLength(1);
    expect(firstResult.errors?.[0]?.code).toBe('TargetDateNotBusinessDay');
    expect(firstResult.errors?.[0]?.message).toBe('対象日が営業日ではないため処理を実行できません。');

    // ===== 第2呼び出し: 営業日で成功 =====
    jest.spyOn(businessDayModule, 'judgeBusinessDayAndDeadline').mockResolvedValueOnce({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00+09:00',
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValueOnce({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: '有効な報告者を取得しました',
    });

    // ユーザーAとBから日報が提出されたことを示す結果
    jest.spyOn(dailyReportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockResolvedValueOnce({
      dailyReports: [
        {
          dailyReportId: 'report-a',
          userId: 'user-a',
          reportDate: targetDateBusinessDay,
          businessContent: 'タスクA完了',
          submittedAt: '2024-01-15T16:00:00+09:00',
        },
        {
          dailyReportId: 'report-b',
          userId: 'user-b',
          reportDate: targetDateBusinessDay,
          businessContent: 'タスクB完了',
          submittedAt: '2024-01-15T16:30:00+09:00',
        },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: new Date().toISOString(),
    });

    // 未提出者: ユーザーDのみ（ユーザーCは無効なため対象外）
    jest.spyOn(nonSubmissionDetectionModule, 'detectNonSubmittedReportersAtDeadline').mockResolvedValueOnce({
      nonSubmittedReporters: [
        {
          userId: 'user-d',
          userName: 'ユーザーD',
          emailAddress: 'd@example.com',
          promptPriority: 'high',
          department: 'dept-1',
        },
      ],
      detectionLog: {
        detectionLogId: 'detection-log-001',
        targetDate: targetDateBusinessDay,
        detectionDateTime: new Date().toISOString(),
        totalReportersCount: 3,
        nonSubmittedCount: 1,
        submittedCount: 2,
      },
      detectionTimestamp: new Date().toISOString(),
    });

    jest.spyOn(promptDecisionModule, 'judgePromptNecessityAndMethod').mockResolvedValueOnce({
      isPromptNecessary: true,
      promptPriority: 'high',
      promptMethod: 'email',
      estimatedNonSubmissionReason: 'input_forgotten',
      suggestedPromptMessage: 'ユーザーDに催促を送信します',
      overdueDurationMinutes: 30,
    });

    jest.spyOn(reminderNotificationModule, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValueOnce({
      success: true,
      notificationId: 'notif-001',
      sentAt: new Date(),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 1,
      errorDetails: null,
    });

    jest.spyOn(emailNotificationModule, 'sendNonSubmissionPromptNotification').mockResolvedValueOnce({
      success: true,
      totalTargets: 1,
      successCount: 1,
      failureCount: 0,
      emailSendingHistoryIds: ['history-001'],
      sentAt: new Date().toISOString(),
    });

    jest.spyOn(dashboardModule, 'retrieveLeaderDashboardData').mockResolvedValueOnce({
      submittedReports: [],
      nonSubmittedReporters: [],
      detectionLogs: [],
      emailSendingHistory: [],
      submissionStatusSummary: {
        totalReporters: 3,
        submittedCount: 2,
        nonSubmittedCount: 1,
        reminderSentCount: 1,
        submissionRate: 0.67,
      },
    });

    const secondResult = await runTx4Imp1Agent(
      {
        targetDate: targetDateBusinessDay,
        leaderUserId,
        teamId,
      },
      mockAiClient
    );

    // 第2呼び出しの結果検証
    expect(secondResult.executionStatus).toBe('success');
    expect(secondResult.submittedReportCount).toBe(2);
    expect(secondResult.nonSubmittedReporterCount).toBe(1);
    expect(secondResult.nonSubmittedReporters).toHaveLength(1);
    expect(secondResult.nonSubmittedReporters[0].userId).toBe('user-d');
    expect(secondResult.promptNotificationsSent).toBe(1);
    expect(secondResult.promptNotificationsFailed).toBe(0);
    expect(secondResult.leaderNotificationSent).toBe(true);
    expect(secondResult.detectionLogId).toBe('detection-log-001');
    expect(secondResult.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(secondResult.errors).toBeUndefined();

    // 無効な報告者（ユーザーC）が対象外であることを確認
    expect(secondResult.nonSubmittedReporters).not.toContainEqual(
      expect.objectContaining({ userId: 'user-c' })
    );
  });
});
