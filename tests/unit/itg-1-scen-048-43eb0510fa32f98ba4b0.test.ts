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
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveLeaderDashboardData: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  sendNonSubmissionPromptNotification: jest.fn(),
}));

import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../src/logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveLeaderDashboardData = retrieveLeaderDashboardData as jest.Mock;
const mockedSendNonSubmissionPromptNotification = sendNonSubmissionPromptNotification as jest.Mock;

describe('SCEN-048: 処理中に複数のエラーが発生した場合、executionStatusはpartial_failureになりerrorsフィールドにすべてのエラーが記録される', () => {
  const targetDate = '2024-01-15';
  const leaderUserId = 'leader-001';
  const teamId = 'team-001';

  const activeReporters = [
    { reporterId: 'R001', userId: 'U001', userName: '報告者1', reporterName: '報告者1', emailAddress: 'u001@example.com', department: '営業部', status: 'active' },
    { reporterId: 'R002', userId: 'U002', userName: '報告者2', reporterName: '報告者2', emailAddress: 'u002@example.com', department: '営業部', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
      submissionDeadlineForTargetDate: `${targetDate}T17:00:00+09:00`,
      processingPolicy: 'accept',
      rejectionReason: null,
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: activeReporters,
      totalCount: activeReporters.length,
      message: '有効な報告者を取得しました。',
    });

    mockedRetrieveDailyReportsForLeaderReview.mockRejectedValue(
      new Error('日報の自動解析処理に失敗しました')
    );

    mockedDetectNonSubmittedReportersAtDeadline.mockRejectedValue(
      new Error('未提出者検知に失敗しました')
    );

    mockedSendLeaderNonSubmissionPromptNotification.mockRejectedValue(
      new Error('未提出者への催促メール送信に失敗しました')
    );

    mockedRetrieveLeaderDashboardData.mockRejectedValue(
      new Error('チーム進捗サマリーの生成に失敗しました')
    );

    mockedSendNonSubmissionPromptNotification.mockRejectedValue(
      new Error('リーダーへの通知送信に失敗しました')
    );
  });

  it('5件のエラーがすべてerrorsに記録され、executionStatusがpartial_failureになる', async () => {
    const result = await runTx4Imp1Agent({
      targetDate,
      leaderUserId,
      teamId,
    });

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'DailyReportAnalysisFailed',
          message: '日報の自動解析処理に失敗しました。',
        }),
        expect.objectContaining({
          code: 'NonSubmissionDetectionFailed',
          message: '未提出者の検知に失敗しました。',
        }),
        expect.objectContaining({
          code: 'PromptNotificationSendingFailed',
          message: '未提出者への催促メール送信に失敗しました。',
        }),
        expect.objectContaining({
          code: 'ProgressSummaryGenerationFailed',
          message: 'チーム進捗サマリーの生成に失敗しました。',
        }),
        expect.objectContaining({
          code: 'LeaderNotificationFailed',
          message: 'リーダーへの通知送信に失敗しました。',
        }),
      ])
    );
    expect(result.errors).toHaveLength(5);

    expect(result.targetDate).toBe(targetDate);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    expect(result.leaderNotificationSent).toBe(false);
  });
});
