import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-406: リーダーへの通知日時が現在日時より未来の場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('通知日時が現在日時より未来の場合、エラーメッセージ「通知日時は現在日時以前である必要があります」を含む例外が発生する', async () => {
    const now = new Date();
    const futureTimestamp = new Date(now.getTime() + 3600000); // 1時間未来
    const input = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: now,
      notificationTimestamp: futureTimestamp,
      approvalDeadlineDays: 3,
    };

    let errorThrown = false;
    let errorMessage = '';

    try {
      await submitUserInformationForConfirmation(input);
    } catch (error: any) {
      errorThrown = true;
      errorMessage = error.message || '';
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toContain('通知日時は現在日時以前である必要があります');
  });

  it('通知日時が未来の場合、ユーザー情報の保存が実行されない', async () => {
    const now = new Date();
    const futureTimestamp = new Date(now.getTime() + 3600000);
    const input = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: now,
      notificationTimestamp: futureTimestamp,
      approvalDeadlineDays: 3,
    };

    const userPersistence = require('../../src/logic/user-master-persistence');

    try {
      await submitUserInformationForConfirmation(input);
    } catch {
      // エラーは予期される
    }

    expect(userPersistence.saveDailyReportRecord).not.toHaveBeenCalled();
  });

  it('通知日時が未来の場合、リーダーへの通知送信が実行されない', async () => {
    const now = new Date();
    const futureTimestamp = new Date(now.getTime() + 3600000);
    const input = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: now,
      notificationTimestamp: futureTimestamp,
      approvalDeadlineDays: 3,
    };

    const notificationModule = require('../../src/logic/daily-report-reminder-notification');

    try {
      await submitUserInformationForConfirmation(input);
    } catch {
      // エラーは予期される
    }

    expect(notificationModule.sendLeaderSubmissionNotification).not.toHaveBeenCalled();
  });
});
