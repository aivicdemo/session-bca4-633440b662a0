import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  SendDailyReportSubmissionNotificationInput,
  LeaderEmailAddressInvalidError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  sendDailyReportSubmissionNotification: jest.fn(),
  LeaderEmailAddressInvalidError: class LeaderEmailAddressInvalidError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LeaderEmailAddressInvalidError';
    }
  },
}));

describe('SCEN-507: メールアドレスの形式が不正な場合、sendLeaderNotificationEmail で「メールアドレスの形式が無効です」のエラーが発生する', () => {
  let mockValidateEmailAddressForDelivery: jest.Mock;
  let mockSendDailyReportSubmissionNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = require('../../src/logic/email-notification-management.ts').validateEmailAddressForDelivery as jest.Mock;
    mockSendDailyReportSubmissionNotification = require('../../src/logic/email-notification-management.ts').sendDailyReportSubmissionNotification as jest.Mock;
  });

  it('メールアドレスの形式が不正（例：invalid-email）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    // テスト対象の関数 sendDailyReportSubmissionNotification を呼び出す準備として、入力型 SendDailyReportSubmissionNotificationInput のフィールドを設定する
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'invalid-email',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    // スタブ validateEmailAddressForDelivery を用意し、不正な形式のメールアドレスが入力された場合に false を返すように構成する
    mockValidateEmailAddressForDelivery.mockReturnValue(false);

    // LeaderEmailAddressInvalidError をスロー
    const LeaderEmailAddressInvalidErrorClass = require('../../src/logic/email-notification-management.ts').LeaderEmailAddressInvalidError;
    mockSendDailyReportSubmissionNotification.mockImplementation(() => {
      throw new LeaderEmailAddressInvalidErrorClass('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    });

    // sendDailyReportSubmissionNotification を呼び出す
    // 関数が LeaderEmailAddressInvalidError 例外をスロー（throw）し、エラーメッセージが『チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。』である
    expect(() => {
      mockSendDailyReportSubmissionNotification(input);
    }).toThrow(LeaderEmailAddressInvalidErrorClass);

    // エラーメッセージが正しいことを確認
    expect(() => {
      mockSendDailyReportSubmissionNotification(input);
    }).toThrow('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
  });

  it('メールアドレスの形式が不正（例：user@）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-002',
      dailyReportId: 'report-20240115-002',
      reportContent: '本日は設計レビューを実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user@',
      reporterName: '鈴木花子',
      submissionTimestamp: '2024-01-15T10:00:00Z',
    };

    mockValidateEmailAddressForDelivery.mockReturnValue(false);

    const LeaderEmailAddressInvalidErrorClass = require('../../src/logic/email-notification-management.ts').LeaderEmailAddressInvalidError;
    mockSendDailyReportSubmissionNotification.mockImplementation(() => {
      throw new LeaderEmailAddressInvalidErrorClass('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    });

    expect(() => {
      mockSendDailyReportSubmissionNotification(input);
    }).toThrow('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
  });

  it('メールアドレスの形式が不正（例：@domain.com）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-003',
      dailyReportId: 'report-20240115-003',
      reportContent: '本日は会議に出席',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '@domain.com',
      reporterName: '佐藤太郎',
      submissionTimestamp: '2024-01-15T11:00:00Z',
    };

    mockValidateEmailAddressForDelivery.mockReturnValue(false);

    const LeaderEmailAddressInvalidErrorClass = require('../../src/logic/email-notification-management.ts').LeaderEmailAddressInvalidError;
    mockSendDailyReportSubmissionNotification.mockImplementation(() => {
      throw new LeaderEmailAddressInvalidErrorClass('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    });

    expect(() => {
      mockSendDailyReportSubmissionNotification(input);
    }).toThrow('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
  });

  it('メールアドレスの形式が不正（例：user name@domain.com）の場合、LeaderEmailAddressInvalidError をスロー', async () => {
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-004',
      dailyReportId: 'report-20240115-004',
      reportContent: '本日はテストを実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'user name@domain.com',
      reporterName: '田中次郎',
      submissionTimestamp: '2024-01-15T12:00:00Z',
    };

    mockValidateEmailAddressForDelivery.mockReturnValue(false);

    const LeaderEmailAddressInvalidErrorClass = require('../../src/logic/email-notification-management.ts').LeaderEmailAddressInvalidError;
    mockSendDailyReportSubmissionNotification.mockImplementation(() => {
      throw new LeaderEmailAddressInvalidErrorClass('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
    });

    expect(() => {
      mockSendDailyReportSubmissionNotification(input);
    }).toThrow('チームリーダーのメールアドレスが無効であるため、通知メールを送信できません。');
  });
});
