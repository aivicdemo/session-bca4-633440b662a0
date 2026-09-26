jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
  buildNotificationContent: jest.fn(),
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  buildNotificationContent,
  SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;
const mockedBuildNotificationContent = buildNotificationContent as jest.MockedFunction<any>;

describe('SCEN-502: 報告内容が空文字列の場合、generateDailyReportNotificationEmail で『日報内容が入力されていません』のエラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return error when reportContent is empty string', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-123',
      reportContent: '',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    mockedBuildNotificationContent.mockRejectedValue(
      new Error('日報内容が入力されていません')
    );

    mockedSendDailyReportSubmissionNotification.mockResolvedValue({
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: '日報内容が入力されていません',
      adminNotificationSent: false,
    });

    const result = await mockedSendDailyReportSubmissionNotification(input);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('日報内容が入力されていません');
  });
});
