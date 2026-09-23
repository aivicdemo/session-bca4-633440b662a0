import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('SCEN-504: 報告者の氏名が登録されていない場合のエラーハンドリング', () => {
  let mockBuildNotificationContent: jest.Mock;
  let mockValidateEmailAddressForDelivery: jest.Mock;
  let mockRecordEmailSendingHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildNotificationContent = jest.fn();
    mockValidateEmailAddressForDelivery = jest.fn();
    mockRecordEmailSendingHistory = jest.fn();
  });

  it('reporterName が空文字列のとき、エラーメッセージ「報告者の情報が不完全です」をスロー', async () => {
    const input = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日は顧客A社との打ち合わせを実施。要件ヒアリング完了。',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '', // 空文字列
      submissionTimestamp: '2024-01-15T18:30:00Z',
    };

    await expect(
      sendDailyReportSubmissionNotification(input)
    ).rejects.toThrow(Error);

    await expect(
      sendDailyReportSubmissionNotification(input)
    ).rejects.toThrow('報告者の情報が不完全です');
  });
});
