jest.mock('../../src/logic/user-master-persistence');

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

describe('SCEN-589: リーダー権限あり、指定日付範囲内のメール送信履歴が存在する場合、フィルター条件に合致した履歴を詳細表示形式で返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フィルター条件に合致したメール送信履歴が詳細表示形式で返される', async () => {
    const leaderId = 'leader-001';
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const emailType = 'daily_report_submission';
    const sendingStatus = 'success';
    const recipientEmail = null;
    const pageNumber = 1;
    const pageSize = 10;

    const mockHistoryRecords = [
      {
        emailSendingHistoryId: 'EH-001',
        userId: 'USER-001',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user@company.com',
        subject: 'Daily Report',
        body: 'Body',
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
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user2@company.com',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-15T09:31:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-15T09:31:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-003',
        userId: 'USER-003',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user3@company.com',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-16T09:30:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-16T09:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-004',
        userId: 'USER-004',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user4@company.com',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-17T09:30:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-17T09:30:00Z'),
      },
      {
        emailSendingHistoryId: 'EH-005',
        userId: 'USER-005',
        emailType: 'daily_report_submission',
        recipientEmailAddress: 'user5@company.com',
        subject: 'Daily Report',
        body: 'Body',
        sentDateTime: new Date('2024-01-18T09:30:00Z'),
        sendingStatus: 'success' as const,
        errorMessage: null,
        relatedDailyReportId: null,
        relatedReminderSettingId: null,
        resendFlag: false,
        createdAt: new Date('2024-01-18T09:30:00Z'),
      },
    ];

    (retrieveEmailSendingHistoryByDateRange as jest.MockedFunction<any>).mockResolvedValue({
      success: true,
      emailSendingHistories: mockHistoryRecords,
      totalCount: 5,
      pageNumber: 1,
      pageSize: 10,
    });

    const result = await retrieveEmailSendingHistoryDetails({
      leaderId,
      startDate,
      endDate,
      emailType,
      sendingStatus,
      recipientEmail,
      pageNumber,
      pageSize,
    });

    expect(result).toBeDefined();
    expect(result.emailHistoryList).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);

    result.emailHistoryList.forEach((history) => {
      expect(history.sendingStatus).toBe('success');
      expect(history.errorMessage).toBeNull();
    });
  });
});
