import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/email-notification-management', () => ({
  sendDailyReportSubmissionNotification: jest.fn(),
}));

import {
  sendDailyReportSubmissionNotification,
  ReporterNotValidError,
  type SendDailyReportSubmissionNotificationInput,
} from '../../src/logic/email-notification-management';

const mockedSendDailyReportSubmissionNotification = sendDailyReportSubmissionNotification as jest.MockedFunction<any>;

describe('SCEN-480: 報告者がシステムに登録されていない場合、ReporterNotValidError が発生して通知を中止する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者がシステムに登録されていない場合、ReporterNotValidError が発生すること', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-not-exists-999',
      dailyReportId: 'daily-001',
      reportContent: '本日の業務内容',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:00:00Z',
    };

    mockedSendDailyReportSubmissionNotification.mockRejectedValue(
      new ReporterNotValidError('報告者が無効であるため、メール通知を送信できません。')
    );

    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow(ReporterNotValidError);
    await expect(mockedSendDailyReportSubmissionNotification(input)).rejects.toThrow('報告者が無効であるため、メール通知を送信できません。');
  });
});
