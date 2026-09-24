jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-069: 一部のユーザー情報処理は成功し一部は失敗した場合', () => {
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

  it('should mark execution as partial_failure when some records succeed and others fail', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({
        valid: false,
        errors: [
          { userId: 'user004', reason: 'email format invalid' },
          { userId: 'user005', reason: 'required field missing' },
        ],
      }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockResolvedValue({ submitted: true, count: 3 }),
      confirmAndApproveUserInformation: jest.fn().mockResolvedValue({
        approved: 3,
        rejected: 0,
        details: [
          { userId: 'user001', approved: true },
          { userId: 'user002', approved: true },
          { userId: 'user003', approved: true },
        ],
      }),
      retrieveUserInformationConfirmationStatus: jest.fn().mockResolvedValue({
        confirmed: 3,
        pending: 0,
        rejected: 0,
      }),
      registerReporter: jest.fn().mockResolvedValue({ registered: 1, errors: [] }),
      updateReporter: jest.fn().mockResolvedValue({ updated: 1, errors: [] }),
      deactivateReporter: jest.fn().mockResolvedValue({ deactivated: 1, errors: [] }),
      registerReporterToMaster: jest.fn().mockResolvedValue({ registered: 1, errors: [] }),
      updateReporterInMaster: jest.fn().mockResolvedValue({ updated: 1, errors: [] }),
      deactivateReporterInMaster: jest.fn().mockResolvedValue({ deactivated: 1, errors: [] }),
      sendUserInformationApprovalNotification: jest.fn().mockResolvedValue({ sent: 3, failed: [] }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({ detectedCount: 0, reporters: [] }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({ sent: 0, failed: [] }),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ logs: [] }),
    };

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.userInformationProcessingResult.approved).toBe(3);
    expect(result.userInformationProcessingResult.rejected).toBe(0);
    expect(result.userInformationProcessingResult.errors.length).toBe(2);
    expect(result.reporterMasterUpdateResult.registered + result.reporterMasterUpdateResult.updated + result.reporterMasterUpdateResult.deactivated).toBe(3);
    expect(result.reporterMasterUpdateResult.errors).toEqual([]);
    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(3);
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);
  });
});
