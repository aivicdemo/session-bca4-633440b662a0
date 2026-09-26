import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeBusinessDayAndDeadline: jest.fn(),
}));

import {
  confirmAndApproveUserInformation,
  type ConfirmAndApproveUserInformationInput,
  UserInformationNotFoundError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;

describe('SCEN-409: 指定されたユーザー情報が存在しないか既に処理済みの場合、UserInformationNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserInformationNotFoundError with message when userInformationId is not found or already processed', async () => {
    // テスト初期化: confirmAndApproveUserInformation関数の呼び出しを準備する

    // authenticateAndAuthorizeLeaderAccessをスタブ化
    // 呼び出されたときに成功結果を返すように設定（リーダー権限ありの状態）
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
      hasApprovalAuthority: true,
    });

    // judgeBusinessDayAndDeadlineをスタブ化
    // 呼び出されたときに期限内の結果を返すように設定
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isWithinDeadline: true,
      daysRemaining: 2,
    });

    // 入力値を設定
    // leaderUserId='leader001', userInformationId='nonexistent-id-12345', approvalDecision='approve',
    // rejectionReason=null, approvalTimestamp=現在時刻のDateオブジェクト
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader001',
      userInformationId: 'nonexistent-id-12345',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    // confirmAndApproveUserInformation関数を入力値で呼び出す
    // 関数が例外を発生させたことを確認する
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      UserInformationNotFoundError
    );

    // 発生した例外がUserInformationNotFoundErrorであることを検証する
    // 例外のメッセージが「ユーザー情報が見つからないか、既に処理済みです。」であることを確認する
    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown UserInformationNotFoundError');
    } catch (error) {
      expect(error).toBeInstanceOf(UserInformationNotFoundError);
      expect((error as Error).message).toBe('ユーザー情報が見つからないか、既に処理済みです。');
    }
  });
});
