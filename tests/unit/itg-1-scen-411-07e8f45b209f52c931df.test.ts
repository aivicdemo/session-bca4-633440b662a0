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
  ApprovalDeadlineExceededError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;

describe('SCEN-411: ユーザー情報の承認期限が経過している場合、ApprovalDeadlineExceededErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ApprovalDeadlineExceededError with correct message when approval deadline has passed', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    } as any);

    mockedJudgeBusinessDayAndDeadline.mockRejectedValue(
      new ApprovalDeadlineExceededError('承認期限が経過しているため、承認できません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-001',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(ApprovalDeadlineExceededError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      '承認期限が経過しているため、承認できません。'
    );
  });

  it('should indicate deadline exceeded status when judgeBusinessDayAndDeadline is called', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      authorized: true,
    } as any);

    mockedJudgeBusinessDayAndDeadline.mockRejectedValue(
      new ApprovalDeadlineExceededError('承認期限が経過しているため、承認できません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-001',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    try {
      await confirmAndApproveUserInformation(input);
    } catch {
      // Expected to throw
    }

    expect(mockedJudgeBusinessDayAndDeadline).toHaveBeenCalled();
  });
});
