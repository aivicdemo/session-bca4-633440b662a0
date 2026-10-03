import { jest } from '@jest/globals';
import { retrieveEmailSendingHistoryDetails } from '../../src/logic/daily-report-management-view';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import type { RetrieveEmailSendingHistoryDetailsInput } from '../../src/logic/daily-report-management-view';

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof userMasterPersistence>('../../src/logic/user-master-persistence'),
  retrieveEmailSendingHistoryByDateRange: jest.fn()
}));

describe('SCEN-589: リーダー権限あり、指定日付範囲内のメール送信履歴が存在する場合、フィルター条件に合致した履歴を詳細表示形式で返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filtered email sending history in display format when leader has permission and history exists', async () => {
    const input: RetrieveEmailSendingHistoryDetailsInput = {
      leaderId: 'leader-001',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      emailType: 'daily_report_submission',
      sendingStatus: 'success',
      recipientEmail: null,
      pageNumber: 1,
      pageSize: 10
    };

    const mockHistoryRecords = [
      {
        emailSendingHistoryId: 'EH-001',
        userId: 'USER-001',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user1@company.com',
        recipientName: 'User 1',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-15T09:30:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        retryFlag: false,
        createdAt: new Date('2024-01-15T09:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-002',
        userId: 'USER-002',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user2@company.com',
        recipientName: 'User 2',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-15T09:31:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        retryFlag: false,
        createdAt: new Date('2024-01-15T09:31:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-003',
        userId: 'USER-003',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user3@company.com',
        recipientName: 'User 3',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-16T09:30:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        retryFlag: false,
        createdAt: new Date('2024-01-16T09:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-004',
        userId: 'USER-004',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user4@company.com',
        recipientName: 'User 4',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-17T09:30:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        retryFlag: false,
        createdAt: new Date('2024-01-17T09:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-005',
        userId: 'USER-005',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user5@company.com',
        recipientName: 'User 5',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-18T09:30:00Z'),
        sendingStatus: 'success',
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        retryFlag: false,
        createdAt: new Date('2024-01-18T09:30:00Z'),
      },
    ];

    (userMasterPersistence.retrieveEmailSendingHistoryByDateRange as jest.Mock<any>).mockResolvedValue(mockHistoryRecords);

    const result = await retrieveEmailSendingHistoryDetails(input);

    expect(result).toBeDefined();
    expect(result.emailHistoryList).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);

    result.emailHistoryList.forEach((history) => {
      expect(history.sentTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(history.recipientEmail).toMatch(/^[a-zA-Z0-9@.]+@company\.com$/);
      expect(history.sendingStatus).toBe('success');
      expect(history.errorMessage).toBeNull();
    });
  });
});
