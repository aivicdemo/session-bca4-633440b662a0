import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
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

  it('should throw UserInformationNotFoundError with correct message when userInformationId is not found', async () => {
    // authenticateAndAuthorizeLeaderAccessをスタブ化
    (mockedAuthenticateAndAuthorizeLeaderAccess as jest.Mock<any>).mockResolvedValue({
      authorized: true,
      hasApprovalAuthority: true,
    });

    // judgeBusinessDayAndDeadlineをスタブ化
    (mockedJudgeBusinessDayAndDeadline as jest.Mock<any>).mockResolvedValue({
      isWithinDeadline: true,
      daysRemaining: 2,
    });

    // 入力値を設定: leaderUserId='leader001', userInformationId='nonexistent-id-12345',
    // approvalDecision='approve', rejectionReason=null, approvalTimestamp=現在時刻
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader001',
      userInformationId: 'nonexistent-id-12345',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    // confirmAndApproveUserInformation関数を呼び出す
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(UserInformationNotFoundError);

    // 例外のメッセージが正確であることを検証
    try {
      await confirmAndApproveUserInformation(input);
      fail('Should have thrown UserInformationNotFoundError');
    } catch (error) {
      expect(error).toBeInstanceOf(UserInformationNotFoundError);
      expect((error as Error).message).toBe('ユーザー情報が見つからないか、既に処理済みです。');
    }
  });

  it('should throw UserInformationNotFoundError when userInformation is already approved', async () => {
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader001',
      userInformationId: 'already-approved-id',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(UserInformationNotFoundError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      'ユーザー情報が見つからないか、既に処理済みです。'
    );
  });

  it('should throw UserInformationNotFoundError when userInformation is already rejected', async () => {
    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader001',
      userInformationId: 'already-rejected-id',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(UserInformationNotFoundError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      'ユーザー情報が見つからないか、既に処理済みです。'
    );
  });
});
