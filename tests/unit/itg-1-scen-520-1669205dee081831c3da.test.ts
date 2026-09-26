import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  SendDailyReportSubmissionNotificationInput,
  DailyReportContentInvalidError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

describe('SCEN-520: reporterName が空文字列の場合、メール本文生成時にエラーになる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DailyReportContentInvalidError がスロー（throw）される', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20250115-001',
      reportContent: '本日の業務内容',
      reportDate: '2025-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '',
      submissionTimestamp: '2025-01-15T09:00:00Z',
    };

    const mockSend = jest.mocked(sendDailyReportSubmissionNotification);
    mockSend.mockRejectedValue(
      new DailyReportContentInvalidError('日報の内容が不完全であるため、通知メールを生成できません。')
    );

    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(DailyReportContentInvalidError);
    await expect(sendDailyReportSubmissionNotification(input)).rejects.toThrow(
      '日報の内容が不完全であるため、通知メールを生成できません。'
    );
  });
});
