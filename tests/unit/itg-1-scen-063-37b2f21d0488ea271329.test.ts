jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-information-input-confirmation');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/email-notification-management');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { submitUserInformationForConfirmation, confirmAndApproveUserInformation } from '../../src/logic/user-information-input-confirmation';
import { registerReporterToMaster } from '../../src/logic/user-master-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';

interface Tx6Imp1AgentInput {
  leaderUserId: string;
  userInformationSubmissions: Array<{
    userId: string;
    userName: string;
    email: string;
    department: string;
    role: string;
  }>;
  executionTimestamp: Date;
  targetDate: Date;
}

describe('SCEN-063: ユーザー情報の承認期限を超過した場合、処理が中断しUserInformationApprovalTimeoutErrorが発生する', () => {
  const leaderUserId = 'leader-001';
  const executionTimestamp = new Date('2024-01-15T17:30:00Z');
  const targetDate = new Date('2024-01-15');
  const userInformationSubmissions = [
    { userId: 'user-001', userName: 'Taro Yamada', email: 'taro@example.com', department: 'Sales', role: 'Staff' },
    { userId: 'user-002', userName: 'Hanako Tanaka', email: 'hanako@example.com', department: 'Sales', role: 'Staff' },
    { userId: 'user-003', userName: 'Jiro Suzuki', email: 'jiro@example.com', department: 'Marketing', role: 'Staff' },
    { userId: 'user-004', userName: 'Sakura Ito', email: 'sakura@example.com', department: 'HR', role: 'Staff' },
    { userId: 'user-005', userName: 'Yuki Nakamura', email: 'yuki@example.com', department: 'Finance', role: 'Staff' },
  ];

  const mockAiClient: Tx6Imp1AiClient = {};

  beforeEach(() => {
    jest.clearAllMocks();

    (authenticateAndAuthorizeLeaderAccess as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      leaderUserId,
      authenticationTimestamp: executionTimestamp,
    });

    (validateUserInformationRequired as jest.Mock).mockResolvedValue({
      isValid: true,
      validationTimestamp: executionTimestamp,
      invalidFields: [],
    });

    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      hasDuplicates: false,
      duplicateEmails: [],
    });

    (submitUserInformationForConfirmation as jest.Mock).mockResolvedValue({
      success: true,
      submissionId: 'submission-001',
      submissionTimestamp: executionTimestamp,
    });

    (confirmAndApproveUserInformation as jest.Mock).mockRejectedValue(
      new Error('UserInformationApprovalTimeoutError: ユーザー情報の承認期限を超過しました。リーダーによる確認が必要です。')
    );

    (registerReporterToMaster as jest.Mock).mockResolvedValue({
      success: true,
    });

    (detectNonSubmittedReportersAtDeadline as jest.Mock).mockResolvedValue({
      detectedCount: 0,
    });

    (sendLeaderNonSubmissionPromptNotification as jest.Mock).mockResolvedValue({
      success: true,
    });
  });

  it('承認期限を超過した場合、UserInformationApprovalTimeoutErrorが発生し処理が中断される', async () => {
    const input = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    let thrownError: Error | null = null;

    try {
      await runTx6Imp1Agent(input, mockAiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/UserInformationApprovalTimeoutError/);
    expect(thrownError?.message).toMatch(/承認期限を超過しました/);
    expect(thrownError?.message).toMatch(/リーダーによる確認が必要です/);

    expect(authenticateAndAuthorizeLeaderAccess).toHaveBeenCalled();
    expect(validateUserInformationRequired).toHaveBeenCalled();
    expect(detectDuplicateEmailAddress).toHaveBeenCalled();
    expect(submitUserInformationForConfirmation).toHaveBeenCalled();
    expect(confirmAndApproveUserInformation).toHaveBeenCalled();

    expect(registerReporterToMaster).not.toHaveBeenCalled();
    expect(detectNonSubmittedReportersAtDeadline).not.toHaveBeenCalled();
    expect(sendLeaderNonSubmissionPromptNotification).not.toHaveBeenCalled();
  });

  it('承認期限超過時に後続の処理が実行されないことを確認', async () => {
    const input = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    try {
      await runTx6Imp1Agent(input, mockAiClient);
    } catch {
      // エラーが発生することは期待される
    }

    const confirmAndApproveCall = (confirmAndApproveUserInformation as jest.Mock).mock.calls.length;
    const reporterMasterUpdateCall = (registerReporterToMaster as jest.Mock).mock.calls.length;
    const nonSubmissionDetectionCall = (detectNonSubmittedReportersAtDeadline as jest.Mock).mock.calls.length;
    const promptNotificationCall = (sendLeaderNonSubmissionPromptNotification as jest.Mock).mock.calls.length;

    expect(confirmAndApproveCall).toBeGreaterThan(0);
    expect(reporterMasterUpdateCall).toBe(0);
    expect(nonSubmissionDetectionCall).toBe(0);
    expect(promptNotificationCall).toBe(0);
  });
});
