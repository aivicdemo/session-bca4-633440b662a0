import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeBusinessDayAndDeadline: jest.fn(),
}));
jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  detectDuplicateEmailAddress: jest.fn(),
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  registerReporterToMaster: jest.fn(),
}));
jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
  sendUserInformationApprovalNotification: jest.fn(),
}));

import {
  confirmAndApproveUserInformation,
  type ConfirmAndApproveUserInformationInput,
  LeaderAuthorizationError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { judgeBusinessDayAndDeadline } from '../../src/logic/business-day-deadline-judgment';
import { detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { registerReporterToMaster } from '../../src/logic/user-master-persistence';
import { sendUserInformationApprovalNotification } from '../../src/logic/email-notification-management';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;
const mockedJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedSendUserInformationApprovalNotification = sendUserInformationApprovalNotification as jest.MockedFunction<any>;

describe('SCEN-410: チームリーダーが当該ユーザー情報の承認権限を持たない場合、LeaderAuthorizationErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LeaderAuthorizationError with correct message when leader lacks approval authority', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(LeaderAuthorizationError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      'このユーザー情報を承認する権限がありません。'
    );
  });

  it('should not call judgeBusinessDayAndDeadline when LeaderAuthorizationError is thrown', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
    } catch {
      // Expected
    }

    expect(mockedJudgeBusinessDayAndDeadline).not.toHaveBeenCalled();
  });

  it('should not call detectDuplicateEmailAddress when LeaderAuthorizationError is thrown', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
    } catch {
      // Expected
    }

    expect(mockedDetectDuplicateEmailAddress).not.toHaveBeenCalled();
  });

  it('should not call registerReporterToMaster when LeaderAuthorizationError is thrown', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
    } catch {
      // Expected
    }

    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
  });

  it('should not call sendUserInformationApprovalNotification when LeaderAuthorizationError is thrown', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      new LeaderAuthorizationError('このユーザー情報を承認する権限がありません。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'user-info-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    try {
      await confirmAndApproveUserInformation(input);
    } catch {
      // Expected
    }

    expect(mockedSendUserInformationApprovalNotification).not.toHaveBeenCalled();
  });
});
