import { sendLeaderSubmissionNotification, InvalidReporterIdError } from '../../src/logic/daily-report-reminder-notification';
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

describe('SCEN-308: 指定された報告者IDが存在しない、または無効な形式である場合、InvalidReporterIdErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('報告者IDが空文字列のとき、InvalidReporterIdErrorをスロー', async () => {
    const input = {
      reporterId: '',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(
      sendLeaderSubmissionNotification(input)
    ).rejects.toThrow(InvalidReporterIdError);
  });

  test('報告者IDが特殊文字のみのとき、InvalidReporterIdErrorをスロー', async () => {
    const input = {
      reporterId: '!@#$',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(
      sendLeaderSubmissionNotification(input)
    ).rejects.toThrow(InvalidReporterIdError);
  });

  test('報告者IDが形式が異なるとき、InvalidReporterIdErrorをスロー', async () => {
    const input = {
      reporterId: '123-456-789',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    await expect(
      sendLeaderSubmissionNotification(input)
    ).rejects.toThrow(InvalidReporterIdError);
  });

  test('エラーメッセージに「報告者IDが無効です。」を含む', async () => {
    const input = {
      reporterId: '',
      leaderId: 'leader-001',
      targetDate: new Date('2025-01-15'),
      submissionTimestamp: new Date('2025-01-15T10:30:00Z'),
      executionTimestamp: new Date('2025-01-15T10:35:00Z'),
    };

    try {
      await sendLeaderSubmissionNotification(input);
      fail('Expected InvalidReporterIdError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidReporterIdError);
      expect((error as Error).message).toContain('報告者IDが無効です。');
    }
  });

});
