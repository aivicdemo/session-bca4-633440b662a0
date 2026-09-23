import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-405: 承認期限が0営業日以下で設定された場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('承認期限が0営業日で設定されたとき、success=false かつ confirmationStatus が承認保留状態ではない状態を返す', async () => {
    const now = new Date();
    const input = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: now,
      approvalDeadlineDays: 0,
    };

    const result = await submitUserInformationForConfirmation(input);

    expect(result.success).toBe(false);
    expect(result.userInformationId).toBeNull();
    expect(result.confirmationStatus).not.toBe('pending_confirmation');
  });

  it('承認期限0営業日時の呼び出しでは、InvalidUserInformationFormatError が発生するか、エラー文言を含む', async () => {
    const now = new Date();
    const input = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: now,
      approvalDeadlineDays: 0,
    };

    try {
      await submitUserInformationForConfirmation(input);
    } catch (error) {
      if (error instanceof InvalidUserInformationFormatError) {
        expect(error.message).toContain('ユーザー情報の入力形式が不正です');
      } else {
        throw error;
      }
    }
  });

  it('承認期限0営業日時、ユーザー情報は保存されず、チームリーダーへの通知も送信されない', async () => {
    const now = new Date();
    const input = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: now,
      approvalDeadlineDays: 0,
    };

    const userPersistence = require('../../src/logic/user-master-persistence');
    const notificationModule = require('../../src/logic/daily-report-reminder-notification');

    await submitUserInformationForConfirmation(input);

    expect(userPersistence.saveDailyReportRecord).not.toHaveBeenCalled();
    expect(notificationModule.sendLeaderSubmissionNotification).not.toHaveBeenCalled();
  });
});
