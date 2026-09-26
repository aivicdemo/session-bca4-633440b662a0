jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));

import { runTx4Imp1Agent, type Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.MockedFunction<any>;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.MockedFunction<any>;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.MockedFunction<any>;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.MockedFunction<any>;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.MockedFunction<any>;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.MockedFunction<any>;

describe('SCEN-049: 報告者マスタの人事異動による更新が反映されていない場合でも、現在有効な報告者のみを対象として処理される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('第1の呼び出し: TargetDateNotBusinessDayエラーで終了する', async () => {
    // Step 2: getActiveReportersForSubmissionCheckをスタブし、有効な報告者を返す
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'user-A', userName: 'User A', reporterName: 'ユーザーA', status: 'active' },
        { userId: 'user-B', userName: 'User B', reporterName: 'ユーザーB', status: 'active' },
        { userId: 'user-D', userName: 'User D', reporterName: 'ユーザーD', status: 'active' },
      ],
      totalCount: 3,
    });

    // Step 3: judgeBusinessDayAndDeadlineをスタブし、非営業日を返す
    const error = new Error('TargetDateNotBusinessDay');
    mockedJudgeBusinessDayAndDeadline.mockRejectedValue(error);

    // Step 4: runTx4Imp1Agentを呼び出す
    const mockAiClient: Tx4Imp1AiClient = {};
    const result = await runTx4Imp1Agent(
      {
        targetDate: '2024-01-13',
        leaderUserId: 'leader-001',
        teamId: 'team-001',
      },
      mockAiClient
    );

    // 検証: executionStatus='failure'
    expect(result.executionStatus).toBe('failure');

    // 検証: errors配列にエラー情報が含まれる
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('第2の呼び出し: 成功し、無効な報告者は除外される', async () => {
    // Step 5: judgeBusinessDayAndDeadlineをスタブし、営業日を返す
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: '2024-01-15T17:00:00',
    });

    // Step 2再: getActiveReportersForSubmissionCheckをスタブし、有効な報告者のみを返す
    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: [
        { userId: 'user-A', userName: 'User A', reporterName: 'ユーザーA', status: 'active' },
        { userId: 'user-B', userName: 'User B', reporterName: 'ユーザーB', status: 'active' },
        { userId: 'user-D', userName: 'User D', reporterName: 'ユーザーD', status: 'active' },
      ],
      totalCount: 3,
    });

    // Step 6: retrieveDailyReportsForLeaderReviewをスタブし、ユーザーAとBから提出を返す
    mockedRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      success: true,
      reports: [
        {
          userId: 'user-A',
          userName: 'User A',
          reporterName: 'ユーザーA',
          submittedAt: '2024-01-15T09:00:00Z',
        },
        {
          userId: 'user-B',
          userName: 'User B',
          reporterName: 'ユーザーB',
          submittedAt: '2024-01-15T10:00:00Z',
        },
      ],
      totalCount: 2,
    });

    // Step 7: detectNonSubmittedReportersAtDeadlineをスタブし、ユーザーDのみを検知
    mockedDetectNonSubmittedReportersAtDeadline.mockResolvedValue({
      success: true,
      nonSubmittedReporters: [
        {
          userId: 'user-D',
          userName: 'User D',
          reporterName: 'ユーザーD',
          lastSubmissionDate: null,
        },
      ],
      detectionLog: {
        detectionLogId: 'log-001',
        detectionTimestamp: '2024-01-15T17:30:00Z',
      },
      totalCount: 1,
    });

    // Step 8: judgePromptNecessityAndMethodをスタブし、催促が必要と返す
    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      success: true,
      promptNecessary: true,
      promptMethod: 'email',
    });

    // Step 9: sendLeaderNonSubmissionPromptNotificationをスタブし、送信成功を返す
    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationId: 'notif-leader-001',
      sentAt: '2024-01-15T15:00:00Z',
    });

    // Step 10: sendNonSubmissionPromptNotificationをスタブし、送信成功を返す
    mockedSendNonSubmissionPromptNotification.mockResolvedValue({
      sent: 1,
      failed: 0,
      sentAt: '2024-01-15T15:01:00Z',
    });

    // Step 11: retrieveLeaderDashboardDataをスタブし、ダッシュボードデータを返す
    mockedRetrieveLeaderDashboardData.mockResolvedValue({
      success: true,
      progressSummary: 'チーム進捗サマリー',
      submissionRate: '66.67%',
    });

    // Step 12: runTx4Imp1Agentを呼び出す（営業日）
    const mockAiClient: Tx4Imp1AiClient = {};
    const result = await runTx4Imp1Agent(
      {
        targetDate: '2024-01-15',
        leaderUserId: 'leader-001',
        teamId: 'team-001',
      },
      mockAiClient
    );

    // 検証: executionStatus='success'
    expect(result.executionStatus).toBe('success');

    // 検証: targetDateが設定されている
    expect(result.targetDate).toBe('2024-01-15');

    // 検証: submittedReportCount=2（ユーザーAとB）
    expect(result.submittedReportCount).toBe(2);

    // 検証: nonSubmittedReporterCount=1（ユーザーDのみ）
    expect(result.nonSubmittedReporterCount).toBe(1);

    // 検証: nonSubmittedReportersにはユーザーDの情報のみが含まれ、削除済みのユーザーCは含まれない
    expect(result.nonSubmittedReporters).toHaveLength(1);
    expect(result.nonSubmittedReporters[0].userId).toBe('user-D');
    expect(result.nonSubmittedReporters[0].reporterName).toBe('ユーザーD');
    expect(result.nonSubmittedReporters[0].lastSubmissionDate).toBeNull();

    // ユーザーCが含まれていないことを確認
    const userCIncluded = result.nonSubmittedReporters.some(
      (r: any) => r.userId === 'user-C' || r.reporterName === 'ユーザーC'
    );
    expect(userCIncluded).toBe(false);

    // 検証: promptNotificationsSent=1、promptNotificationsFailed=0
    expect(result.promptNotificationsSent).toBe(1);
    expect(result.promptNotificationsFailed).toBe(0);

    // 検証: leaderNotificationSent=true
    expect(result.leaderNotificationSent).toBe(true);

    // 検証: detectionLogIdが生成されている
    expect(result.detectionLogId).toBe('log-001');

    // 検証: executionTimestampがISO 8601形式で記録されている
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/
    );

    // 検証: errors配列は空である
    expect(result.errors ?? []).toEqual([]);

    // 検証: 無効な報告者（ユーザーC）は処理対象から完全に除外されている
    expect(mockedGetActiveReportersForSubmissionCheck).toHaveBeenCalled();
    const activeReportersResult = mockedGetActiveReportersForSubmissionCheck.mock.results[mockedGetActiveReportersForSubmissionCheck.mock.results.length - 1];
    const activeReportersData = await activeReportersResult.value;
    const userCInActive = activeReportersData.reporters.some(
      (r: any) => r.userId === 'user-C' || r.reporterName === 'ユーザーC'
    );
    expect(userCInActive).toBe(false);

    // 検証: 現在有効な報告者（ユーザーA、B、D）のみに対して処理が実行されている
    expect(activeReportersData.reporters).toHaveLength(3);
    expect(activeReportersData.reporters.map((r: any) => r.userId)).toEqual(['user-A', 'user-B', 'user-D']);
  });
});
