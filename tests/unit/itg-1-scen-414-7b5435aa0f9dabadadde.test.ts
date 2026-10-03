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
  ConfirmAndApproveUserInformationInput,
  ApprovalNotificationSendFailureError,
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

describe('SCEN-414: ApprovalNotificationSendFailureError when notification send fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ApprovalNotificationSendFailureError with correct message when notification send fails', async () => {
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader-001',
    });
    mockedJudgeBusinessDayAndDeadline.mockResolvedValue({
      isAcceptable: true,
      isWithinDeadline: true,
    });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      duplicateReporterUserId: null,
      duplicateReporterName: null,
    });
    mockedRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'reporter-001',
      message: 'registered',
    });
    mockedSendUserInformationApprovalNotification.mockRejectedValue(
      new ApprovalNotificationSendFailureError('承認結果の通知送信に失敗しました。')
    );

    const input: ConfirmAndApproveUserInformationInput = {
      leaderUserId: 'leader-001',
      userInformationId: 'userinfo-123',
      approvalDecision: 'approve',
      rejectionReason: null,
      approvalTimestamp: new Date(),
    };

    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(ApprovalNotificationSendFailureError);
    await expect(confirmAndApproveUserInformation(input)).rejects.toThrow(
      '承認結果の通知送信に失敗しました。'
    );
  });
});
