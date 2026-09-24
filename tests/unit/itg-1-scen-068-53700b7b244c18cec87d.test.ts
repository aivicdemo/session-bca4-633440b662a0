jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-068: 人事異動・新入社員配置・退職異動・プロジェクト配置変更により報告者マスタ更新が必要な場合', () => {
  const leaderUserId = 'leader001';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');
  const targetDate = new Date('2024-01-15');

  const userInformationSubmissions = [
    { userId: 'user001', userName: '新入社員太郎', email: 'newuser@example.com', department: '営業部', role: '報告者' },
    { userId: 'user002', userName: '異動者花子', email: 'moved@example.com', department: '企画部', role: '報告者' },
    { userId: 'user003', userName: '退職者次郎', email: 'retired@example.com', department: '営業部', role: '報告者' },
    { userId: 'user004', userName: '配置変更美咲', email: 'reassigned@example.com', department: '営業部', role: 'リーダー' },
  ];

  it('should record personnel movement cases as exceptions and execute master updates', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockResolvedValue({ submitted: true, count: 4 }),
      confirmAndApproveUserInformation: jest.fn().mockResolvedValue({
        approved: 3,
        rejected: 1,
        details: [
          { userId: 'user001', approved: true },
          { userId: 'user002', approved: true },
          { userId: 'user003', approved: false },
          { userId: 'user004', approved: true },
        ],
      }),
      retrieveUserInformationConfirmationStatus: jest.fn().mockResolvedValue({
        confirmed: 3,
        pending: 0,
        rejected: 1,
      }),
      registerReporter: jest.fn().mockResolvedValue({ registered: 1, errors: [] }),
      updateReporter: jest.fn().mockResolvedValue({ updated: 2, errors: [] }),
      deactivateReporter: jest.fn().mockResolvedValue({ deactivated: 1, errors: [] }),
      registerReporterToMaster: jest.fn().mockResolvedValue({ registered: 1, errors: [] }),
      updateReporterInMaster: jest.fn().mockResolvedValue({ updated: 2, errors: [] }),
      deactivateReporterInMaster: jest.fn().mockResolvedValue({ deactivated: 1, errors: [] }),
      sendUserInformationApprovalNotification: jest.fn().mockResolvedValue({ sent: 3, failed: [] }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        detectedCount: 3,
        reporters: ['user001', 'user002', 'user004'],
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({ sent: 3, failed: [] }),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ logs: [] }),
    };

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
      mockAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.userInformationProcessingResult.approved).toBe(3);
    expect(result.userInformationProcessingResult.rejected).toBe(1);
    expect(result.reporterMasterUpdateResult.registered).toBe(1);
    expect(result.reporterMasterUpdateResult.updated).toBe(2);
    expect(result.reporterMasterUpdateResult.deactivated).toBe(1);
    expect(result.exceptionCases.length).toBeGreaterThan(0);

    result.exceptionCases.forEach(exceptionCase => {
      expect(exceptionCase).toHaveProperty('caseId');
      expect(exceptionCase).toHaveProperty('description');
      expect(exceptionCase).toHaveProperty('requiredLeaderAction');
    });

    expect(result.executionLog).toContain('新入社員');
  });
});
