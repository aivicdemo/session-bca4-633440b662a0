jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

class UserInformationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserInformationValidationError';
  }
}

describe('SCEN-062: 提出ユーザー情報に必須項目不足・形式不正・重複メールが含まれる場合', () => {
  const leaderUserId = 'leader001';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');
  const targetDate = new Date('2024-01-15');

  it('should throw UserInformationValidationError for missing required fields', async () => {
    const invalidSubmissions = [
      { userId: 'user001', userName: null, email: null, department: null, role: null },
    ];

    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockRejectedValue(
        new UserInformationValidationError('ユーザー情報の検証に失敗しました。必須項目の確認と形式を修正してください。')
      ),
      detectDuplicateEmailAddress: jest.fn(),
      submitUserInformationForConfirmation: jest.fn(),
      confirmAndApproveUserInformation: jest.fn(),
      retrieveUserInformationConfirmationStatus: jest.fn(),
      registerReporter: jest.fn(),
      updateReporter: jest.fn(),
      deactivateReporter: jest.fn(),
      registerReporterToMaster: jest.fn(),
      updateReporterInMaster: jest.fn(),
      deactivateReporterInMaster: jest.fn(),
      sendUserInformationApprovalNotification: jest.fn(),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
    };

    await expect(
      runTx6Imp1Agent(
        { leaderUserId, userInformationSubmissions: invalidSubmissions, executionTimestamp, targetDate },
        mockAiClient
      )
    ).rejects.toThrow(UserInformationValidationError);

    expect(mockAiClient.validateUserInformationRequired).toHaveBeenCalled();
  });

  it('should throw UserInformationValidationError for malformed email format', async () => {
    const invalidSubmissions = [
      { userId: 'user001', userName: '田中太郎', email: 'invalid-email-no-at', department: '営業部', role: '報告者' },
    ];

    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockRejectedValue(
        new UserInformationValidationError('ユーザー情報の検証に失敗しました。必須項目の確認と形式を修正してください。')
      ),
      detectDuplicateEmailAddress: jest.fn(),
      submitUserInformationForConfirmation: jest.fn(),
      confirmAndApproveUserInformation: jest.fn(),
      retrieveUserInformationConfirmationStatus: jest.fn(),
      registerReporter: jest.fn(),
      updateReporter: jest.fn(),
      deactivateReporter: jest.fn(),
      registerReporterToMaster: jest.fn(),
      updateReporterInMaster: jest.fn(),
      deactivateReporterInMaster: jest.fn(),
      sendUserInformationApprovalNotification: jest.fn(),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
    };

    await expect(
      runTx6Imp1Agent(
        { leaderUserId, userInformationSubmissions: invalidSubmissions, executionTimestamp, targetDate },
        mockAiClient
      )
    ).rejects.toThrow(UserInformationValidationError);
  });

  it('should throw UserInformationValidationError for duplicate email addresses', async () => {
    const invalidSubmissions = [
      { userId: 'user001', userName: '田中太郎', email: 'duplicate@example.com', department: '営業部', role: '報告者' },
      { userId: 'user002', userName: '鈴木花子', email: 'duplicate@example.com', department: '営業部', role: '報告者' },
    ];

    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockRejectedValue(
        new UserInformationValidationError('ユーザー情報の検証に失敗しました。必須項目の確認と形式を修正してください。')
      ),
      submitUserInformationForConfirmation: jest.fn(),
      confirmAndApproveUserInformation: jest.fn(),
      retrieveUserInformationConfirmationStatus: jest.fn(),
      registerReporter: jest.fn(),
      updateReporter: jest.fn(),
      deactivateReporter: jest.fn(),
      registerReporterToMaster: jest.fn(),
      updateReporterInMaster: jest.fn(),
      deactivateReporterInMaster: jest.fn(),
      sendUserInformationApprovalNotification: jest.fn(),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
    };

    await expect(
      runTx6Imp1Agent(
        { leaderUserId, userInformationSubmissions: invalidSubmissions, executionTimestamp, targetDate },
        mockAiClient
      )
    ).rejects.toThrow(UserInformationValidationError);

    expect(mockAiClient.detectDuplicateEmailAddress).toHaveBeenCalled();
  });
});
