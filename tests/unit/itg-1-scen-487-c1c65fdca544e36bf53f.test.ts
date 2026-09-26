import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-487: ユーザーマスタが空の場合、validateReporterValidity で『チームの報告者マスタが設定されていません』のエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーマスタが空の場合、エラーが発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'daily-001',
      reportContent: '本日は営業活動を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '報告者',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new Error('チームの報告者マスタが設定されていません')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('チームの報告者マスタが設定されていません');
  });
});
