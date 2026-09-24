jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-065: 報告者マスタの登録・更新・削除処理が失敗した場合', () => {
  const leaderUserId = 'leader001';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');
  const targetDate = new Date('2024-01-15');

  const userInformationSubmissions = [
    { userId: 'user001', userName: '田中太郎', email: 'tanaka@example.com', department: '営業部', role: '報告者' },
    { userId: 'user002', userName: '鈴木花子', email: 'suzuki@example.com', department: '営業部', role: '報告者' },
    { userId: 'user003', userName: '佐藤次郎', email: 'sato@example.com', department: '営業部', role: '報告者' },
  ];

  it('should include reporter master update errors in output with partial_failure status', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockResolvedValue({ submitted: true, count: 3 }),
      confirmAndApproveUserInformation: jest.fn().mockResolvedValue({
        approved: 3,
        rejected: 0,
        details: userInformationSubmissions.map(u => ({ userId: u.userId, approved: true })),
      }),
      retrieveUserInformationConfirmationStatus: jest.fn().mockResolvedValue({
        confirmed: 3,
        pending: 0,
        rejected: 0,
      }),
      registerReporter: jest.fn().mockResolvedValue({
        registered: 0,
        errors: [{ userId: 'user001', reason: 'データベース接続失敗' }],
      }),
      updateReporter: jest.fn().mockResolvedValue({ updated: 0, errors: [] }),
      deactivateReporter: jest.fn().mockResolvedValue({ deactivated: 0, errors: [] }),
      registerReporterToMaster: jest.fn().mockResolvedValue({
        registered: 0,
        errors: [{ userId: 'user001', reason: 'データベース接続失敗' }],
      }),
      updateReporterInMaster: jest.fn().mockResolvedValue({ updated: 0, errors: [] }),
      deactivateReporterInMaster: jest.fn().mockResolvedValue({ deactivated: 0, errors: [] }),
      sendUserInformationApprovalNotification: jest.fn().mockResolvedValue({ sent: 3, failed: [] }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({ detectedCount: 0, reporters: [] }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({ sent: 0, failed: [] }),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ logs: [] }),
    };

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
      mockAiClient
    );

    expect(['partial_failure', 'failure']).toContain(result.executionStatus);
    expect(result.reporterMasterUpdateResult.errors.length).toBeGreaterThan(0);

    const error = result.reporterMasterUpdateResult.errors[0];
    expect(error).toHaveProperty('userId');
    expect(error).toHaveProperty('reason');
    expect(error.reason).toContain('報告者マスタの更新に失敗しました。システム管理者に確認してください。');
  });
});
