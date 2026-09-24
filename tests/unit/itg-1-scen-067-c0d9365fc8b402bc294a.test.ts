jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

class SystemIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemIntegrationError';
  }
}

describe('SCEN-067: メール送信・永続化・認証などの外部サービス連携に失敗した場合', () => {
  const leaderUserId = 'leader001';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');
  const targetDate = new Date('2024-01-15');

  const userInformationSubmissions = [
    { userId: 'user001', userName: '田中太郎', email: 'tanaka@example.com', department: '営業部', role: '報告者' },
    { userId: 'user002', userName: '鈴木花子', email: 'suzuki@example.com', department: '営業部', role: '報告者' },
  ];

  it('should throw SystemIntegrationError for external service failures', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockRejectedValue(
        new SystemIntegrationError('システム連携エラーが発生しました。後で再試行してください。')
      ),
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
        { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
        mockAiClient
      )
    ).rejects.toThrow(SystemIntegrationError);
  });

  it('should handle persistence failure and return failure status', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockResolvedValue({ submitted: true, count: 2 }),
      confirmAndApproveUserInformation: jest.fn().mockResolvedValue({
        approved: 2,
        rejected: 0,
        details: userInformationSubmissions.map(u => ({ userId: u.userId, approved: true })),
      }),
      retrieveUserInformationConfirmationStatus: jest.fn().mockResolvedValue({
        confirmed: 2,
        pending: 0,
        rejected: 0,
      }),
      registerReporter: jest.fn().mockResolvedValue({ registered: 1, errors: [] }),
      updateReporter: jest.fn().mockResolvedValue({ updated: 1, errors: [] }),
      deactivateReporter: jest.fn().mockResolvedValue({ deactivated: 0, errors: [] }),
      registerReporterToMaster: jest.fn().mockRejectedValue(
        new SystemIntegrationError('システム連携エラーが発生しました。後で再試行してください。')
      ),
      updateReporterInMaster: jest.fn(),
      deactivateReporterInMaster: jest.fn(),
      sendUserInformationApprovalNotification: jest.fn(),
      detectNonSubmittedReportersAtDeadline: jest.fn(),
      sendLeaderNonSubmissionPromptNotification: jest.fn(),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
    };

    await expect(
      runTx6Imp1Agent(
        { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
        mockAiClient
      )
    ).rejects.toThrow(SystemIntegrationError);
  });
});
