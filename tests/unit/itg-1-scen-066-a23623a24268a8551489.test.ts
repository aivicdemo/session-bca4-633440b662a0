jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

class NonSubmissionPromptExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonSubmissionPromptExecutionError';
  }
}

describe('SCEN-066: 未提出者への自動催促メール送信に失敗した場合', () => {
  const leaderUserId = 'leader001';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');
  const targetDate = new Date('2024-01-15');

  const userInformationSubmissions = [
    { userId: 'user001', userName: '田中太郎', email: 'tanaka@example.com', department: '営業部', role: '報告者' },
    { userId: 'user002', userName: '鈴木花子', email: 'suzuki@example.com', department: '営業部', role: '報告者' },
    { userId: 'user003', userName: '佐藤次郎', email: 'sato@example.com', department: '営業部', role: '報告者' },
    { userId: 'user004', userName: '伊藤美咲', email: 'ito@example.com', department: '営業部', role: '報告者' },
    { userId: 'user005', userName: '渡辺健一', email: 'watanabe@example.com', department: '営業部', role: '報告者' },
  ];

  it('should handle non-submission prompt execution error and return result with failed notifications', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockResolvedValue({ submitted: true, count: 5 }),
      confirmAndApproveUserInformation: jest.fn().mockResolvedValue({
        approved: 5,
        rejected: 0,
        details: userInformationSubmissions.map(u => ({ userId: u.userId, approved: true })),
      }),
      retrieveUserInformationConfirmationStatus: jest.fn().mockResolvedValue({
        confirmed: 5,
        pending: 0,
        rejected: 0,
      }),
      registerReporter: jest.fn().mockResolvedValue({ registered: 2, errors: [] }),
      updateReporter: jest.fn().mockResolvedValue({ updated: 2, errors: [] }),
      deactivateReporter: jest.fn().mockResolvedValue({ deactivated: 1, errors: [] }),
      registerReporterToMaster: jest.fn().mockResolvedValue({ registered: 2, errors: [] }),
      updateReporterInMaster: jest.fn().mockResolvedValue({ updated: 2, errors: [] }),
      deactivateReporterInMaster: jest.fn().mockResolvedValue({ deactivated: 1, errors: [] }),
      sendUserInformationApprovalNotification: jest.fn().mockResolvedValue({ sent: 5, failed: [] }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        detectedCount: 3,
        reporters: ['user001', 'user002', 'user003'],
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockRejectedValue(
        new NonSubmissionPromptExecutionError('未提出者への催促メール送信に失敗しました。手動対応が必要です。')
      ),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ logs: [] }),
    };

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.nonSubmissionDetectionResult.detectedCount).toBe(3);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBe(0);
    expect(result.nonSubmissionDetectionResult.errors.length).toBeGreaterThan(0);
    expect(result.notificationSendingResult.failedNotifications.length).toBeGreaterThanOrEqual(3);

    const failedNotifications = result.notificationSendingResult.failedNotifications.filter(
      n => n.type === 'non_submission_prompt'
    );
    expect(failedNotifications.length).toBeGreaterThanOrEqual(3);
  });
});
