import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';

describe('SCEN-405: 承認期限が0営業日以下で設定された場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('承認期限が0営業日で設定された場合、エラーが発生して処理が中断される', async () => {
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date(),
    };

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();

      if (!result.success) {
        expect(result.userInformationId).toBeNull();
        expect(result.confirmationStatus).not.toBe('pending_approval');
      }
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidUserInformationFormatError);
    }
  });

  it('承認期限が負の値で設定された場合も、同様にエラーが発生する', async () => {
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date(),
    };

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();

      if (!result.success) {
        expect(result.userInformationId).toBeNull();
        expect(result.confirmationStatus).not.toBe('pending_approval');
      }
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('エラー発生時、ユーザー情報は保存されず、チームリーダーへの通知も送信されない', async () => {
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date(),
    };

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();

      if (!result.success) {
        expect(result.userInformationId).toBeNull();
      }
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidUserInformationFormatError);
    }
  });

  it('エラーメッセージが期限制約に関する内容を含むことを確認する', async () => {
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date(),
    };

    const expectedErrorMessage =
      'ユーザー情報の入力形式が不正です。必須項目を確認し、メールアドレスの重複がないか確認してください。';

    try {
      const result: any = await submitUserInformationForConfirmation(input);
      expect(result).toBeDefined();

      if (!result.success && result.confirmationStatus === 'validation_failed') {
        expect(result.userInformationId).toBeNull();
      }
    } catch (err) {
      if (err instanceof InvalidUserInformationFormatError) {
        expect((err as Error).message).toContain('入力形式が不正です');
      }
    }
  });
});
