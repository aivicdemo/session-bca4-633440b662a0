jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retrieveEmailSendingHistoryDetails, type RetrieveEmailSendingHistoryDetailsInput } from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

const mockRetrieveEmailSendingHistoryByDateRange = userMasterPersistence.retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>;

describe('SCEN-598: 送信先メールアドレスフィルターがnull の場合、メールアドレスによるフィルタリングが適用されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recipientEmail=null のとき、メールアドレスフィルターが適用されず、emailType=daily_report_submission と sendingStatus=success に合致する3件すべてが返される', async () => {
    const recordA = {
      historyId: 'EH-001',
      recipientId: 'USER-001',
      recipientEmail: 'user1@example.com',
      recipientName: 'User One',
      emailType: 'daily_report_submission',
      subject: 'Daily Report',
      sentTime: '2024-01-15T09:30:00Z',
      sendingStatus: 'success',
      errorMessage: null,
      relatedReportId: 'report-001',
      relatedReminderSettingId: null,
      retryFlag: false,
    };

    const recordB = {
      historyId: 'EH-002',
      recipientId: 'USER-002',
      recipientEmail: 'user2@example.com',
      recipientName: 'User Two',
      emailType: 'daily_report_submission',
      subject: 'Daily Report',
      sentTime: '2024-01-15T10:00:00Z',
      sendingStatus: 'success',
      errorMessage: null,
      relatedReportId: 'report-002',
      relatedReminderSettingId: null,
      retryFlag: false,
    };

    const recordC = {
      historyId: 'EH-003',
      recipientId: 'USER-003',
      recipientEmail: 'user3@example.com',
      recipientName: 'User Three',
      emailType: 'non_submission_prompt',
      subject: 'Non-Submission Prompt',
      sentTime: '2024-01-15T10:30:00Z',
      sendingStatus: 'success',
      errorMessage: null,
      relatedReportId: null,
      relatedReminderSettingId: null,
      retryFlag: false,
    };

    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([recordA, recordB, recordC]);

    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: 'daily_report_submission',
      sendingStatus: 'success',
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await retrieveEmailSendingHistoryDetails(input);

    expect(result.emailHistoryList).toBeDefined();
    expect(result.emailHistoryList!.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);

    const emails = result.emailHistoryList!.map((h) => h.recipientEmail);
    expect(emails).toContain('user1@example.com');
    expect(emails).toContain('user2@example.com');
    expect(emails).toContain('user3@example.com');
  });
});
