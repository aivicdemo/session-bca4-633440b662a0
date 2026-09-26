jest.mock('../../src/logic/user-master-persistence', () => ({
  retrieveEmailSendingHistoryByDateRange: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  RetrieveEmailSendingHistoryDetailsInput,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-596: メールタイプフィルターがnull の場合、全タイプのメール送信履歴が対象に含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールタイプフィルターがnullの場合、全タイプのメール送信履歴が含まれる', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    const mockHistoryRecords = [
      {
        emailSendingHistoryId: 'EH-001',
        userId: 'USER-001',
        emailType: 'daily_report_submission' as const,
        recipientEmailAddress: 'user1@example.com',
        subject: 'Daily Report Submission',
        body: 'Please submit your daily report',
        sentDateTime: new Date('2024-01-15T09:30:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T09:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-002',
        userId: 'USER-002',
        emailType: 'non_submission_prompt' as const,
        recipientEmailAddress: 'user2@example.com',
        subject: 'Non-Submission Reminder',
        body: 'You have not submitted your daily report',
        sentDateTime: new Date('2024-01-15T10:00:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-003',
        userId: 'USER-003',
        emailType: 'reminder_notification' as const,
        recipientEmailAddress: 'user3@example.com',
        subject: 'Reminder Notification',
        body: 'Reminder to submit your report',
        sentDateTime: new Date('2024-01-15T10:30:00Z'),
        sendingStatus: 'failure' as const,
        errorMessage: 'SMTP timeout',
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-004',
        userId: 'USER-004',
        emailType: 'user_information_approval' as const,
        recipientEmailAddress: 'user4@example.com',
        subject: 'User Information Approval',
        body: 'Please approve user information',
        sentDateTime: new Date('2024-01-15T11:00:00Z'),
        sendingStatus: 'pending' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T11:00:00Z'),
      },
    ];

    (retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      emailSendingHistories: mockHistoryRecords,
      totalCount: 4,
      pageNumber: 1,
      pageSize: 10,
    });

    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId,
      startDate,
      endDate,
      emailType: null,
      sendingStatus: null,
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10,
    };

    const result = await retrieveEmailSendingHistoryDetails(input);

    expect(result.emailHistoryList).toHaveLength(4);
    expect(result.emailHistoryList.some(h => h.emailType === 'daily_report_submission')).toBe(true);
    expect(result.emailHistoryList.some(h => h.emailType === 'non_submission_prompt')).toBe(true);
    expect(result.emailHistoryList.some(h => h.emailType === 'reminder_notification')).toBe(true);
    expect(result.emailHistoryList.some(h => h.emailType === 'user_information_approval')).toBe(true);
    expect(result.totalCount).toBe(4);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
  });
});
