import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  confirmAndApproveUserInformation,
  ConfirmAndApproveUserInformationInput,
  UserInformationNotFoundError,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');

describe('SCEN-409: 指定されたユーザー情報が存在しないか既に処理済みの場合、UserInformationNotFoundErrorが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateAndAuthorizeLeaderAccess =
      userAuthModule.authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline = businessDayModule.judgeBusinessDayAndDeadline as jest.Mock;

    // authenticateAndAuthorizeLeaderAccessをスタブ化: 成功結果を返す
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ authorized: true });

    // judgeBusinessDayAndDeadlineをスタブ化: 期限内の結果を返す
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({ isWithinDeadline: true });
  });

  it('指定されたユーザー情報が存在しないか既に処理済みの場合、UserInformationNotFoundErrorが発生する', async () => {
    // 入力値を設定
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader001',
      userInformationId: 'nonexistent-id-12345',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    // 関数を呼び出し、例外が発生することを確認
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      UserInformationNotFoundError
    );

    // 発生した例外のメッセージを確認
    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown UserInformationNotFoundError');
    } catch (error) {
      expect(error).toBeInstanceOf(UserInformationNotFoundError);
      expect((error as Error).message).toBe('ユーザー情報が見つからないか、既に処理済みです。');
    }
  });
});
