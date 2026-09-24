jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  formatEmailHistoryForDisplay: jest.fn(),
  retrieveEmailSendingHistoryDetails: jest.fn(),
}));

import { retrieveEmailSendingHistoryDetails } from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';
import { formatEmailHistoryForDisplay } from '../../src/logic/daily-report-management-view';
import type {
  RetrieveEmailSendingHistoryDetailsInput,
  RetrieveEmailSendingHistoryDetailsOutput,
  EmailHistoryDetail,
} from '../../src/logic/daily-report-management-view';

const mockedRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.Mock;
const mockedFormatEmailHistoryForDisplay = formatEmailHistoryForDisplay as jest.Mock;
const mockedRetrieveEmailSendingHistoryDetails = retrieveEmailSendingHistoryDetails as jest.Mock;

describe('SCEN-599: 送信先メールアドレスに部分一致検索を適用した場合、条件に部分的に合致するメール履歴が抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract email histories matching partial recipient email filter @example.com and return formatted list', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const emailType = null;
    const sendingStatus = null;
    const recipientEmail = '@example.com';
    const pageNumber = 1;
    const pageSize = 20;

    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId,
      startDate,
      endDate,
      emailType,
      sendingStatus,
      recipientEmail,
      pageNumber,
      pageSize,
    };

    const rawEmailHistories = [
      {
        emailSendingHistoryId: 'hist-1',
        userId: 'user-a',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user-a@example.com',
        subject: 'Daily Report Submission',
        body: 'Please submit your daily report',
        sentDateTime: new Date('2024-01-15T10:00:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        emailSendingHistoryId: 'hist-2',
        userId: 'user-b',
        emailType: 'non_submission_prompt',
        recipientEmailAddress: 'user-b@example.co.jp',
        subject: 'Non-submission Prompt',
        body: 'Please submit your daily report',
        sentDateTime: new Date('2024-01-16T14:30:00Z'),
        sendingStatus: 'failure',
        errorMessage: 'SMTP timeout',
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-16T14:30:00Z'),
      },
      {
        emailSendingHistoryId: 'hist-3',
        userId: 'admin',
        emailType: 'reminder_notification',
        recipientEmailAddress: 'admin@other-domain.org',
        subject: 'Reminder Notification',
        body: 'This is a reminder',
        sentDateTime: new Date('2024-01-17T09:15:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-17T09:15:00Z'),
      },
      {
        emailSendingHistoryId: 'hist-4',
        userId: 'report-user',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'report-user@example.com',
        subject: 'Daily Report Submission',
        body: 'Please submit your daily report',
        sentDateTime: new Date('2024-01-18T11:45:00Z'),
        sendingStatus: 'pending',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-18T11:45:00Z'),
      },
    ];

    const formattedEmailHistories: EmailHistoryDetail[] = [
      {
        historyId: 'hist-1',
        recipientId: 'user-a',
        recipientEmail: 'user-a@example.com',
        recipientName: 'User A',
        emailType: 'daily_report_submission',
        subject: 'Daily Report Submission',
        sentTime: '2024-01-15T10:00:00Z',
        sendingStatus: 'success',
        errorMessage: null,
      },
      {
        historyId: 'hist-2',
        recipientId: 'user-b',
        recipientEmail: 'user-b@example.co.jp',
        recipientName: 'User B',
        emailType: 'non_submission_prompt',
        subject: 'Non-submission Prompt',
        sentTime: '2024-01-16T14:30:00Z',
        sendingStatus: 'failed',
        errorMessage: 'SMTP timeout',
      },
      {
        historyId: 'hist-4',
        recipientId: 'report-user',
        recipientEmail: 'report-user@example.com',
        recipientName: 'Report User',
        emailType: 'daily_report_submission',
        subject: 'Daily Report Submission',
        sentTime: '2024-01-18T11:45:00Z',
        sendingStatus: 'pending',
        errorMessage: null,
      },
    ];

    mockedRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      success: true,
      emailSendingHistories: rawEmailHistories,
      totalCount: rawEmailHistories.length,
      pageNumber,
      pageSize,
      hasNextPage: false,
    });

    mockedFormatEmailHistoryForDisplay.mockImplementation((history) => {
      return formattedEmailHistories.find((h) => h.historyId === history.emailSendingHistoryId);
    });

    const expectedOutput: RetrieveEmailSendingHistoryDetailsOutput = {
      emailHistoryList: formattedEmailHistories,
      totalCount: 3,
      pageNumber: 1,
      pageSize: 20,
      hasNextPage: false,
    };

    mockedRetrieveEmailSendingHistoryDetails.mockResolvedValue(expectedOutput);

    const result = await retrieveEmailSendingHistoryDetails(input);

    expect(result.emailHistoryList).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.hasNextPage).toBe(false);

    const emailAddressesInResult = result.emailHistoryList.map((h) => h.recipientEmail);
    expect(emailAddressesInResult).toContain('user-a@example.com');
    expect(emailAddressesInResult).toContain('user-b@example.co.jp');
    expect(emailAddressesInResult).toContain('report-user@example.com');
    expect(emailAddressesInResult).not.toContain('admin@other-domain.org');

    expect(result.emailHistoryList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipientEmail: 'user-a@example.com',
          sendingStatus: 'success',
          errorMessage: null,
        }),
        expect.objectContaining({
          recipientEmail: 'user-b@example.co.jp',
          sendingStatus: 'failed',
          errorMessage: 'SMTP timeout',
        }),
        expect.objectContaining({
          recipientEmail: 'report-user@example.com',
          sendingStatus: 'pending',
          errorMessage: null,
        }),
      ])
    );
  });
});
