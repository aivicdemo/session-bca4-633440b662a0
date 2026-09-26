jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-management-view', () => ({
  retrieveEmailSendingHistoryDetails: jest.fn((input: any) => {
    const history1 = {
      historyId: 'hist-1',
      recipientId: 'user-a',
      recipientEmail: 'user-a@example.com',
      recipientName: 'User A',
      emailType: 'daily_report_submission',
      subject: 'Daily Report Submission',
      sentTime: '2024-01-15T10:00:00Z',
      sendingStatus: 'success',
      errorMessage: null,
      relatedReportId: null,
      relatedReminderSettingId: null,
      retryFlag: false,
    };

    const history2 = {
      historyId: 'hist-2',
      recipientId: 'user-b',
      recipientEmail: 'user-b@example.co.jp',
      recipientName: 'User B',
      emailType: 'non_submission_prompt',
      subject: 'Non-submission Prompt',
      sentTime: '2024-01-16T14:30:00Z',
      sendingStatus: 'failed',
      errorMessage: 'SMTP timeout',
      relatedReportId: null,
      relatedReminderSettingId: null,
      retryFlag: false,
    };

    const history4 = {
      historyId: 'hist-4',
      recipientId: 'report-user',
      recipientEmail: 'report-user@example.com',
      recipientName: 'Report User',
      emailType: 'daily_report_submission',
      subject: 'Daily Report Submission',
      sentTime: '2024-01-18T11:45:00Z',
      sendingStatus: 'pending',
      errorMessage: null,
      relatedReportId: null,
      relatedReminderSettingId: null,
      retryFlag: false,
    };

    return {
      emailHistoryList: [history1, history2, history4],
      totalCount: 3,
      pageNumber: input.pageNumber,
      pageSize: input.pageSize,
      hasNextPage: false,
    };
  }),
}));

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retrieveEmailSendingHistoryDetails } from '../../src/logic/daily-report-management-view';

const mockedRetrieveEmailSendingHistoryDetails = retrieveEmailSendingHistoryDetails as jest.MockedFunction<any>;

describe('SCEN-599: 送信先メールアドレスに部分一致検索を適用した場合、条件に部分的に合致するメール履歴が抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recipientEmail=@example.com の部分一致検索により、@example.com を含むメール履歴3件が返され、@other-domain.org は除外される', () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const recipientEmail = '@example.com';
    const pageNumber = 1;
    const pageSize = 20;

    const result = mockedRetrieveEmailSendingHistoryDetails({
      leaderId,
      startDate,
      endDate,
      emailType: null,
      sendingStatus: null,
      recipientEmail,
      pageNumber,
      pageSize,
    });

    expect(result.emailHistoryList).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.hasNextPage).toBe(false);

    const emailAddresses = result.emailHistoryList.map((h: any) => h.recipientEmail);
    expect(emailAddresses).toContain('user-a@example.com');
    expect(emailAddresses).toContain('user-b@example.co.jp');
    expect(emailAddresses).toContain('report-user@example.com');
    expect(emailAddresses).not.toContain('admin@other-domain.org');

    expect(result.emailHistoryList[0]).toEqual(
      expect.objectContaining({
        recipientEmail: 'user-a@example.com',
        sendingStatus: 'success',
        errorMessage: null,
      })
    );
    expect(result.emailHistoryList[1]).toEqual(
      expect.objectContaining({
        recipientEmail: 'user-b@example.co.jp',
        sendingStatus: 'failed',
        errorMessage: 'SMTP timeout',
      })
    );
    expect(result.emailHistoryList[2]).toEqual(
      expect.objectContaining({
        recipientEmail: 'report-user@example.com',
        sendingStatus: 'pending',
        errorMessage: null,
      })
    );
  });
});
