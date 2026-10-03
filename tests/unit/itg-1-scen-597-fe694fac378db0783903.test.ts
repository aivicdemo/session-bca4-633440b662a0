import { retrieveEmailSendingHistoryDetails } from '../../src/logic/daily-report-management-view';
import type { RetrieveEmailSendingHistoryDetailsInput, RetrieveEmailSendingHistoryDetailsOutput } from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

describe('retrieveEmailSendingHistoryDetails - SCEN-597', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include all sending statuses (success, failed, pending) when sendingStatus filter is null', async () => {
    // SCEN-597: sendingStatus=nullのとき、全ステータスのメール送信履歴が対象に含まれる

    const mockEmailHistories = [
      {
        emailSendingHistoryId: 'history_success_001',
        userId: 'leader_001',
        emailType: 'daily_report_submission' as const,
        recipientEmailAddress: 'reporter1@example.com',
        subject: 'Daily Report Received',
        body: 'Your daily report has been received.',
        sentDateTime: new Date('2024-01-15T10:00:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: 'report_001',
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        emailSendingHistoryId: 'history_failed_002',
        userId: 'leader_001',
        emailType: 'non_submission_prompt' as const,
        recipientEmailAddress: 'reporter2@example.com',
        subject: 'Reminder: Daily Report Not Submitted',
        body: 'Please submit your daily report.',
        sentDateTime: new Date('2024-01-20T15:30:00Z'),
        sendingStatus: 'failed' as const,
        errorMessage: 'SMTP connection timeout',
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: true,
        createdAt: new Date('2024-01-20T15:30:00Z'),
      },
      {
        emailSendingHistoryId: 'history_pending_003',
        userId: 'leader_001',
        emailType: 'reminder_notification' as const,
        recipientEmailAddress: 'reporter3@example.com',
        subject: 'Daily Report Reminder',
        body: 'Gentle reminder to submit your daily report.',
        sentDateTime: new Date('2024-01-25T14:00:00Z'),
        sendingStatus: 'pending' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: 'reminder_001',
        resendFlag: false,
        createdAt: new Date('2024-01-25T14:00:00Z'),
      },
    ];

    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as jest.Mock).mockResolvedValue({
      success: true,
      emailSendingHistories: mockEmailHistories,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 10,
      message: 'Email sending histories retrieved successfully',
    });

    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader_001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result: RetrieveEmailSendingHistoryDetailsOutput = await retrieveEmailSendingHistoryDetails(input);

    // 仕様: emailHistoryListに、指定された日付範囲内に送信された全ステータス（成功・失敗・保留中）のメール履歴が含まれる
    expect(result.emailHistoryList).toHaveLength(3);
    expect(result.emailHistoryList.map(h => h.sendingStatus)).toEqual(['success', 'failed', 'pending']);

    // 仕様: emailHistoryListの件数は、sendingStatus=nullとして全ステータスを対象に検索した結果であることを示す
    const statuses = new Set(result.emailHistoryList.map(h => h.sendingStatus));
    expect(statuses.size).toBe(3);
    expect(statuses.has('success')).toBe(true);
    expect(statuses.has('failed')).toBe(true);
    expect(statuses.has('pending')).toBe(true);

    // 仕様: totalCountに合致したメール送信履歴の総件数が設定される
    expect(result.totalCount).toBe(3);

    // 仕様: pageNumber=1、pageSize=10、hasNextPageが正確に計算される
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);

    // 仕様: エラーは発生しない
    expect(result.emailHistoryList[0].errorMessage).toBeNull();
    expect(result.emailHistoryList[1].errorMessage).toBe('SMTP connection timeout');
    expect(result.emailHistoryList[2].errorMessage).toBeNull();

    // 検索が正しいパラメータで呼ばれたことを確認
    expect(userMasterPersistence.retrieveEmailSendingHistoryByDateRange).toHaveBeenCalledWith(
      expect.objectContaining({
        startDateTime: expect.any(Date),
        endDateTime: expect.any(Date),
        sendingStatusFilter: undefined,
        emailTypeFilter: undefined,
        pageNumber: 1,
        pageSize: 10,
      })
    );
  });
});
