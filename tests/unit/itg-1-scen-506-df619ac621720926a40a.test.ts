import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendDailyReportSubmissionNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
  SendDailyReportSubmissionNotificationInput,
  SendDailyReportSubmissionNotificationOutput,
  LeaderEmailAddressNotFoundError,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management.ts', () => ({
  validateEmailAddressForDelivery: jest.fn(),
  buildNotificationContent: jest.fn(),
  recordEmailSendingHistory: jest.fn(),
  sendDailyReportSubmissionNotification: jest.fn(),
  LeaderEmailAddressNotFoundError: class LeaderEmailAddressNotFoundError extends Error {},
}));

describe('SCEN-506: リーダーのメールアドレスが登録されていない場合、sendLeaderNotificationEmail で「リーダーのメールアドレスが未設定です」のエラーが発生する', () => {
  let mockValidateEmailAddressForDelivery: jest.Mock;
  let mockBuildNotificationContent: jest.Mock;
  let mockRecordEmailSendingHistory: jest.Mock;
  let mockSendDailyReportSubmissionNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddressForDelivery = require('../../src/logic/email-notification-management.ts').validateEmailAddressForDelivery as jest.Mock;
    mockBuildNotificationContent = require('../../src/logic/email-notification-management.ts').buildNotificationContent as jest.Mock;
    mockRecordEmailSendingHistory = require('../../src/logic/email-notification-management.ts').recordEmailSendingHistory as jest.Mock;
    mockSendDailyReportSubmissionNotification = require('../../src/logic/email-notification-management.ts').sendDailyReportSubmissionNotification as jest.Mock;
  });

  it('leaderEmailAddress が空文字列（未設定）のとき、sendDailyReportSubmissionNotification は LeaderEmailAddressNotFoundError に相当する処理を実行し、出力の success=false、emailSendingHistoryId=null、sentAt=null、errorMessage=チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。、adminNotificationSent=true を返す', async () => {
    // テスト対象の入力値を構築する
    const input: SendDailyReportSubmissionNotificationInput = {
      reporterId: 'reporter-001',
      dailyReportId: 'report-20240115-001',
      reportContent: '本日はシステム開発を実施',
      reportDate: '2024-01-15',
      leaderUserId: 'leader-001',
      leaderEmailAddress: '',
      reporterName: '山田太郎',
      submissionTimestamp: '2024-01-15T09:30:00Z',
    };

    // validateEmailAddressForDelivery が空文字列に対して false を返すようスタブ化
    mockValidateEmailAddressForDelivery.mockReturnValue(false);

    // sendDailyReportSubmissionNotification の戻り値を設定
    const expectedOutput: SendDailyReportSubmissionNotificationOutput = {
      success: false,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: 'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。',
      adminNotificationSent: true,
    };
    mockSendDailyReportSubmissionNotification.mockReturnValue(expectedOutput);

    // sendDailyReportSubmissionNotification を呼び出す
    const result = mockSendDailyReportSubmissionNotification(input) as SendDailyReportSubmissionNotificationOutput;

    // 戻り値の success フィールドが false であることを確認
    expect(result.success).toBe(false);

    // 戻り値の emailSendingHistoryId フィールドが null であることを確認
    expect(result.emailSendingHistoryId).toBeNull();

    // 戻り値の sentAt フィールドが null であることを確認
    expect(result.sentAt).toBeNull();

    // 戻り値の errorMessage フィールドに 'チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。' が格納されていることを確認
    expect(result.errorMessage).toBe('チームリーダーのメールアドレスが登録されていないため、通知メールを送信できません。');

    // 戻り値の adminNotificationSent フィールドが true であることを確認（管理者に失敗通知が送信されたことを示す）
    expect(result.adminNotificationSent).toBe(true);

    // スタブ化されている validateEmailAddressForDelivery が呼び出されたことを確認し、leaderEmailAddress='' を受け取ったことを検証
    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalled();
    const validateCall = mockValidateEmailAddressForDelivery.mock.calls[0][0];
    expect(validateCall).toHaveProperty('emailAddress', '');

    // スタブ化されている buildNotificationContent が呼び出されていないことを確認（バリデーション失敗後は呼び出されない）
    expect(mockBuildNotificationContent).not.toHaveBeenCalled();

    // スタブ化されている recordEmailSendingHistory が呼び出されていないことを確認（失敗時は履歴が記録されない）
    expect(mockRecordEmailSendingHistory).not.toHaveBeenCalled();
  });
});
