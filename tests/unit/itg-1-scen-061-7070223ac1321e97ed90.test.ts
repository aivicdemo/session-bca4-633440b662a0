jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-061: リーダーが正規ユーザー情報をエージェントに提出し、全工程が正常に完了する', () => {
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

  it('should complete all workflow steps successfully with valid user information', async () => {
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
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({ detectedCount: 0, reporters: [] }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({ sent: 0, failed: [] }),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ logs: [] }),
    };

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
      mockAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.userInformationProcessingResult.approved).toBe(5);
    expect(result.userInformationProcessingResult.rejected).toBe(0);
    expect(result.userInformationProcessingResult.errors).toEqual([]);
    expect(result.reporterMasterUpdateResult.registered).toBe(2);
    expect(result.reporterMasterUpdateResult.updated).toBe(2);
    expect(result.reporterMasterUpdateResult.deactivated).toBe(1);
    expect(result.reporterMasterUpdateResult.errors).toEqual([]);
    expect(result.nonSubmissionDetectionResult.detectedCount).toBeGreaterThanOrEqual(0);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBeGreaterThanOrEqual(0);
    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(5);
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);
    expect(result.exceptionCases).toEqual([]);
    expect(result.executionLog).toBeTruthy();
  });
});
