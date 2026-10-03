import { sendLeaderSubmissionNotification, DailyReportNotFoundError } from '../../src/logic/daily-report-reminder-notification';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as dailyReportPersistenceModule from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserHasLeaderRole: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveDailyReportsForLeaderReview: jest.fn(),
}));

describe('SCEN-309: 指定された対象日付に対応する日報が存在しない場合、DailyReportNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(userAuthModule, 'validateUserHasLeaderRole').mockResolvedValue({
      hasLeaderRole: true,
      userId: 'leader-001',
    });

    jest.spyOn(dailyReportPersistenceModule, 'retrieveDailyReportsForLeaderReview').mockRejectedValue(
      new DailyReportNotFoundError('指定日付の日報が見つかりません。')
    );
  });

  test('指定日付の日報が見つからないとき、DailyReportNotFoundErrorをスロー', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T09:30:00Z'),
      executionTimestamp: new Date('2025-01-15T09:35:00Z'),
    };

    await expect(
      sendLeaderSubmissionNotification(input)
    ).rejects.toThrow(DailyReportNotFoundError);
  });

  test('エラーメッセージが「指定日付の日報が見つかりません。」である', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T09:30:00Z'),
      executionTimestamp: new Date('2025-01-15T09:35:00Z'),
    };

    try {
      await sendLeaderSubmissionNotification(input);
      fail('Expected DailyReportNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DailyReportNotFoundError);
      expect((error as Error).message).toBe('指定日付の日報が見つかりません。');
    }
  });

});
