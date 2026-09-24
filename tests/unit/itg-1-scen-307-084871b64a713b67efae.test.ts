jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/email-notification-management');

import {
  sendLeaderSubmissionNotification,
  LeaderNotFoundError,
} from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-307: 報告者が属するチームのリーダーが見つからない、またはリーダーのメールアドレスが登録されていない場合、LeaderNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderNotFoundError when leader is not found in user master', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(LeaderNotFoundError);
    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(
      'リーダー情報が見つかりません。報告者のチーム設定を確認してください。'
    );
  });

  it('should throw LeaderNotFoundError when leader email is null', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(LeaderNotFoundError);
  });

  it('should throw LeaderNotFoundError when leader email is empty string', async () => {
    const input = {
      reporterId: 'reporter-001',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(sendLeaderSubmissionNotification(input)).rejects.toThrow(LeaderNotFoundError);
  });
});
