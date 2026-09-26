import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-486: 報告者IDが空の場合、validateReporterValidity で『報告者IDが指定されていません』のエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterId が空文字列の場合、エラーが発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: '',
      dailyReportId: 'daily-001',
      reportContent: '本日は顧客対応を実施した',
      reportDate: '2024-01-15T00:00:00Z',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new Error('報告者IDが指定されていません')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('報告者IDが指定されていません');
  });
});
