import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveEmailSendingHistoryDetails,
  RetrieveEmailSendingHistoryDetailsOutput,
} from '../../src/logic/daily-report-management-view';
import { retrieveEmailSendingHistoryByDateRange } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

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

    // スタブ準備：retrieveEmailSendingHistoryByDateRange
    const mockHistoryRecords = [
      {
        historyId: 'EH-001',
        recipientId: 'USER-001',
        recipientEmail: 'user001@company.com',
        recipientName: '山田太郎',
        emailType: 'daily_report_submission',
        subject: '日報提出通知',
        sentTime: '2024-01-15T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
        relatedReportId: 'REP-001',
        relatedReminderSettingId: null,
        retryFlag: false,
      },
      {
        historyId: 'EH-002',
        recipientId: 'USER-002',
        recipientEmail: 'user002@company.com',
        recipientName: '鈴木花子',
        emailType: 'daily_report_submission',
        subject: '日報提出通知',
        sentTime: '2024-01-15T09:31:00Z',
        sendingStatus: 'success',
        errorMessage: null,
        relatedReportId: 'REP-002',
        relatedReminderSettingId: null,
        retryFlag: false,
      },
      {
        historyId: 'EH-003',
        recipientId: 'USER-003',
        recipientEmail: 'user003@company.com',
        recipientName: '田中次郎',
        emailType: 'daily_report_submission',
        subject: '日報提出通知',
        sentTime: '2024-01-16T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
        relatedReportId: 'REP-003',
        relatedReminderSettingId: null,
        retryFlag: false,
      },
      {
        historyId: 'EH-004',
        recipientId: 'USER-004',
        recipientEmail: 'user004@company.com',
        recipientName: '佐藤四郎',
        emailType: 'daily_report_submission',
        subject: '日報提出通知',
        sentTime: '2024-01-17T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
        relatedReportId: 'REP-004',
        relatedReminderSettingId: null,
        retryFlag: false,
      },
      {
        historyId: 'EH-005',
        recipientId: 'USER-005',
        recipientEmail: 'user005@company.com',
        recipientName: '田辺五郎',
        emailType: 'daily_report_submission',
        subject: '日報提出通知',
        sentTime: '2024-01-18T09:30:00Z',
        sendingStatus: 'success',
        errorMessage: null,
        relatedReportId: 'REP-005',
        relatedReminderSettingId: null,
        retryFlag: false,
      },
    ];

    jest.mocked(retrieveEmailSendingHistoryByDateRange).mockResolvedValue(mockHistoryRecords);

    // テスト対象処理を実行
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

    // 期待値検証
    expect(result).toBeDefined();
    expect(result.emailHistoryList).toHaveLength(5);

    // 各メール履歴の詳細を検証
    result.emailHistoryList.forEach((history, index) => {
      expect(history.sentTime).toBe(mockHistoryRecords[index].sentTime);
      expect(history.recipientEmail).toBe(mockHistoryRecords[index].recipientEmail);
      expect(history.sendingStatus).toBe('success');
      expect(history.errorMessage).toBeNull();
    });

    // 集計情報の検証
    expect(result.totalCount).toBe(5);
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.hasNextPage).toBe(false);
  });
});
