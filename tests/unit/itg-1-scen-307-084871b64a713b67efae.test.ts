import { sendLeaderSubmissionNotification, LeaderNotFoundError } from '../../src/logic/daily-report-reminder-notification';
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

describe('SCEN-307: 報告者が属するチームのリーダーが見つからない、またはリーダーのメールアドレスが登録されていない場合、LeaderNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(userAuthModule, 'validateUserHasLeaderRole').mockRejectedValue(
      new LeaderNotFoundError('リーダー情報が見つかりません。報告者のチーム設定を確認してください。')
    );
  });

  test('should throw LeaderNotFoundError when leader is not found', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(
      sendLeaderSubmissionNotification(input)
    ).rejects.toThrow(LeaderNotFoundError);
  });

  test('LeaderNotFoundError should contain correct error message', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    try {
      await sendLeaderSubmissionNotification(input);
      fail('Expected LeaderNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LeaderNotFoundError);
      expect((error as Error).message).toBe('リーダー情報が見つかりません。報告者のチーム設定を確認してください。');
    }
  });

});
