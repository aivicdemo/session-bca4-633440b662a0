import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx6Imp1Agent,
  UserInformationApprovalTimeoutError,
  Tx6Imp1AgentInput,
  Tx6Imp1AgentOutput,
} from '../../src/agents/tx-6-imp-1/orchestrator';
import {
  authenticateAndAuthorizeLeaderAccess,
  AuthenticateLeaderAccessInput,
  AuthenticateLeaderAccessOutput,
} from '../../src/logic/user-authentication-authorization';
import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
  detectDuplicateEmailAddress,
  DetectDuplicateEmailAddressInput,
  DetectDuplicateEmailAddressOutput,
} from '../../src/logic/input-validation-formatting';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
  confirmAndApproveUserInformation,
  ConfirmAndApproveUserInformationInput,
  ConfirmAndApproveUserInformationOutput,
} from '../../src/logic/user-information-input-confirmation';

// テスト用のモック設定
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-information-input-confirmation');

describe('SCEN-063: ユーザー情報の承認期限を超過した場合、処理が中断しUserInformationApprovalTimeoutErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('承認期限を超過した場合、UserInformationApprovalTimeoutErrorが発生し処理が中断される', async () => {
    // テスト入力値の準備
    const leaderUserId = 'leader-001';
    const userInformationSubmissions = [
      { userId: 'user-001', userName: 'Taro Yamada', email: 'taro@example.com', department: 'Sales', role: 'Staff' },
      { userId: 'user-002', userName: 'Hanako Tanaka', email: 'hanako@example.com', department: 'Sales', role: 'Staff' },
      { userId: 'user-003', userName: 'Jiro Suzuki', email: 'jiro@example.com', department: 'Marketing', role: 'Staff' },
      { userId: 'user-004', userName: 'Sakura Ito', email: 'sakura@example.com', department: 'HR', role: 'Staff' },
      { userId: 'user-005', userName: 'Yuki Nakamura', email: 'yuki@example.com', department: 'Finance', role: 'Staff' },
    ];
    const executionTimestamp = new Date('2024-01-15T17:30:00Z');
    const targetDate = new Date('2024-01-15');

    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    // スタブ設定：authenticateAndAuthorizeLeaderAccess が成功
    jest.mocked(authenticateAndAuthorizeLeaderAccess).mockResolvedValue({
      isAuthorized: true,
      leaderUserId,
      authenticationTimestamp: executionTimestamp,
    } as AuthenticateLeaderAccessOutput);

    // スタブ設定：validateUserInformationRequired が成功（すべて必須項目を満たす）
    jest.mocked(validateUserInformationRequired).mockResolvedValue({
      isValid: true,
      validationTimestamp: executionTimestamp,
      invalidFields: [],
    } as ValidateUserInformationRequiredOutput);

    // スタブ設定：detectDuplicateEmailAddress が成功（重複なし）
    jest.mocked(detectDuplicateEmailAddress).mockResolvedValue({
      hasDuplicates: false,
      duplicateEmails: [],
    } as DetectDuplicateEmailAddressOutput);

    // スタブ設定：submitUserInformationForConfirmation が成功
    jest.mocked(submitUserInformationForConfirmation).mockResolvedValue({
      success: true,
      submissionId: 'submission-001',
      submissionTimestamp: executionTimestamp,
    } as SubmitUserInformationForConfirmationOutput);

    // スタブ設定：confirmAndApproveUserInformation が承認期限超過エラーを投げる
    jest.mocked(confirmAndApproveUserInformation).mockRejectedValue(
      new UserInformationApprovalTimeoutError(
        'ユーザー情報の承認期限を超過しました。リーダーによる確認が必要です。'
      )
    );

    // テスト実行
    try {
      await runTx6Imp1Agent(input);
      // エラーが発生しない場合はテスト失敗
      throw new Error('UserInformationApprovalTimeoutErrorが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが UserInformationApprovalTimeoutError であることを確認
      if (!(error instanceof UserInformationApprovalTimeoutError)) {
        throw error;
      }

      // エラー文言が期待値であることを確認
      expect(error.message).toBe('ユーザー情報の承認期限を超過しました。リーダーによる確認が必要です。');

      // 戻り値の出力型 Tx6Imp1AgentOutput は返却されないことを確認（例外が発生）
      // confirmAndApproveUserInformation が呼ばれたことを確認
      expect(jest.mocked(confirmAndApproveUserInformation)).toHaveBeenCalled();

      // authenticateAndAuthorizeLeaderAccess が呼ばれたことを確認
      expect(jest.mocked(authenticateAndAuthorizeLeaderAccess)).toHaveBeenCalled();

      // validateUserInformationRequired が呼ばれたことを確認
      expect(jest.mocked(validateUserInformationRequired)).toHaveBeenCalled();

      // detectDuplicateEmailAddress が呼ばれたことを確認
      expect(jest.mocked(detectDuplicateEmailAddress)).toHaveBeenCalled();

      // submitUserInformationForConfirmation が呼ばれたことを確認
      expect(jest.mocked(submitUserInformationForConfirmation)).toHaveBeenCalled();
    }
  });
});
