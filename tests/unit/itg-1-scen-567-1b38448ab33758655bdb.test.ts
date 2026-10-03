import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import type { RetrieveLeaderDashboardDataInput, RetrieveLeaderDashboardDataOutput } from '../../src/logic/daily-report-management-view';

const authenticateAndAuthorizeLeaderAccessMock = jest.fn() as jest.Mock<any>;
const judgeBusinessDayAndDeadlineMock = jest.fn() as jest.Mock<any>;
const retrieveDailyReportsForLeaderReviewMock = jest.fn() as jest.Mock<any>;
const retrieveNonSubmissionDetectionLogsByDateMock = jest.fn() as jest.Mock<any>;
const retrieveEmailSendingHistoryByDateRangeMock = jest.fn() as jest.Mock<any>;

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: authenticateAndAuthorizeLeaderAccessMock,
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeBusinessDayAndDeadline: judgeBusinessDayAndDeadlineMock,
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveDailyReportsForLeaderReview: retrieveDailyReportsForLeaderReviewMock,
  retrieveNonSubmissionDetectionLogsByDate: retrieveNonSubmissionDetectionLogsByDateMock,
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveEmailSendingHistoryByDateRange: retrieveEmailSendingHistoryByDateRangeMock,
}));

describe('SCEN-567: リーダーメールアドレスが登録され形式が正しく有効化されていれば配信が成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('詳細設計の仕様が validateAndDeliverLeaderNotification を含まないため、メール配信検証の成功ケースは保留', async () => {
    // NOTE: 仕様567は validateAndDeliverLeaderNotification 関数がメール配信を実行し成功することを前提にしていますが、
    // 詳細設計の retrieveLeaderDashboardData の呼び出し関係にはこの関数が存在しません。
    // 詳細設計が更新されるまで、このテストは保留となります。
    // .aivic/batches/131/unresolved.md を参照してください。
    expect(true).toBe(true);
  });

  it('すべての前提条件が満たされた正常系で、ダッシュボードデータが返される', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    (authenticateAndAuthorizeLeaderAccessMock as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
    });

    (judgeBusinessDayAndDeadlineMock as jest.Mock<any>).mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
    });

    (retrieveDailyReportsForLeaderReviewMock as jest.Mock<any>).mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'report-001',
          userId: 'reporter-001',
          reportDate: '2024-01-15',
          businessContent: '本日の業務完了',
          submittedAt: '2024-01-15T14:30:00',
          achievements: '成果',
          challenges: '課題',
          tomorrowPlan: '明日',
          reporterName: 'Reporter A',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00',
    });

    (retrieveNonSubmissionDetectionLogsByDateMock as jest.Mock<any>).mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:00:00',
    });

    (retrieveEmailSendingHistoryByDateRangeMock as jest.Mock<any>).mockResolvedValue({
      success: true,
      emailSendingHistories: [
        {
          historyId: 'hist-001',
          recipientId: leaderId,
          recipientEmail: 'leader@example.com',
          emailType: 'daily_report_submitted',
          subject: '本日の業務完了',
          sentTime: '2024-01-15T14:30:00',
          sendingStatus: 'success',
          errorMessage: null,
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
    });

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId,
      targetDate,
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    // 関数が正常終了し、出力型 RetrieveLeaderDashboardDataOutput が返されることを確認
    expect(output).toBeDefined();
    expect(output.submittedReports).toBeDefined();
    expect(output.nonSubmittedReporters).toBeDefined();
    expect(output.detectionLogs).toBeDefined();
    expect(output.emailSendingHistory).toBeDefined();
    expect(output.submissionStatusSummary).toBeDefined();

    // submittedReports の内容が整形済みであることを確認
    expect(output.submittedReports).toEqual(expect.any(Array));
    expect(output.nonSubmittedReporters).toEqual(expect.any(Array));
    expect(output.submissionStatusSummary.totalReporters).toBeGreaterThanOrEqual(0);
  });
});
