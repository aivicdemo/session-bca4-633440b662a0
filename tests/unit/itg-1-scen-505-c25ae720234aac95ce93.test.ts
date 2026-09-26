import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  ValidateEmailAddressForDeliveryInput,
  ValidateEmailAddressForDeliveryOutput,
  BuildNotificationContentInput,
  BuildNotificationContentOutput,
  RecordEmailSendingHistoryInput,
  RecordEmailSendingHistoryOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-505: 報告者名・日報内容・送信日時がすべて有効な場合、generateDailyReportNotificationEmail はメール本文を正常に生成する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockValidateEmailAddressForDelivery = validateEmailAddressForDelivery as jest.MockedFunction<any>;
    const mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    const mockRecordEmailSendingHistory = recordEmailSendingHistory as jest.MockedFunction<any>;
    const mockSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    } as ValidateEmailAddressForDeliveryOutput);

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n営業先A社への訪問、提案資料作成、Q1予算申請書作成。課題: 承認フローが不透明。明日: 承認状況確認、営業先B社での引き合い対応',
    } as BuildNotificationContentOutput);

    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-001',
      recordedAt: '2024-01-15T18:30:05Z',
      errorMessage: null,
    } as RecordEmailSendingHistoryOutput);

    mockSendDailyReportSubmissionNotification.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-001',
      sentAt: '2024-01-15T18:30:05Z',
      errorMessage: null,
      adminNotificationSent: false,
    } as SendDailyReportSubmissionNotificationOutput);
  });

  it('有効なすべてのパラメータで呼び出すと、success=true のアウトプットを返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '営業先A社への訪問、提案資料作成、Q1予算申請書作成。課題: 承認フローが不透明。明日: 承認状況確認、営業先B社での引き合い対応',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const result = await sendDailyReportSubmissionNotification(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-001');
    expect(result.sentAt).toBe('2024-01-15T18:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);
  });

  it('buildNotificationContent が正しい件名と本文を返す', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '営業先A社への訪問、提案資料作成、Q1予算申請書作成。課題: 承認フローが不透明。明日: 承認状況確認、営業先B社での引き合い対応',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    const mockBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;
    const expectedContent = {
      subject: '【日報】2024年01月15日 山田太郎',
      body: '山田太郎さんからの日報です\n\n営業先A社への訪問、提案資料作成、Q1予算申請書作成。課題: 承認フローが不透明。明日: 承認状況確認、営業先B社での引き合い対応',
    };
    mockBuildNotificationContent.mockResolvedValue(expectedContent);

    const result = await buildNotificationContent({
      notificationType: 'daily_report_submission',
      reporterName: '山田太郎',
      reportDate: '2024-01-15',
      reportContent: input.reportContent,
    } as BuildNotificationContentInput);

    expect(result.subject).toBe('【日報】2024年01月15日 山田太郎');
    expect(result.body).toBe('山田太郎さんからの日報です\n\n営業先A社への訪問、提案資料作成、Q1予算申請書作成。課題: 承認フローが不透明。明日: 承認状況確認、営業先B社での引き合い対応');
  });
});
