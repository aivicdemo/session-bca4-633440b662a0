jest.mock('../../src/agents/tx-6-imp-1/orchestrator-dependencies');

import { runTx6Imp1Agent, Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-071: targetDateで指定された営業日に未提出者が0人の場合', () => {
  const leaderUserId = 'leader001';
  const executionTimestamp = new Date('2024-01-15T10:00:00Z');
  const targetDate = new Date('2024-01-15');

  it('should return zero detectedCount when no non-submitted reporters on target date', async () => {
    const mockAiClient: Tx6Imp1AiClient = {
      authenticateAndAuthorizeLeaderAccess: jest.fn().mockResolvedValue({ authorized: true }),
      validateUserInformationRequired: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ duplicateFound: false, duplicates: [] }),
      submitUserInformationForConfirmation: jest.fn().mockResolvedValue({ submitted: true, count: 0 }),
      confirmAndApproveUserInformation: jest.fn().mockResolvedValue({
        approved: 0,
        rejected: 0,
        details: [],
      }),
      retrieveUserInformationConfirmationStatus: jest.fn().mockResolvedValue({
        confirmed: 0,
        pending: 0,
        rejected: 0,
      }),
      registerReporter: jest.fn().mockResolvedValue({ registered: 0, errors: [] }),
      updateReporter: jest.fn().mockResolvedValue({ updated: 0, errors: [] }),
      deactivateReporter: jest.fn().mockResolvedValue({ deactivated: 0, errors: [] }),
      registerReporterToMaster: jest.fn().mockResolvedValue({ registered: 0, errors: [] }),
      updateReporterInMaster: jest.fn().mockResolvedValue({ updated: 0, errors: [] }),
      deactivateReporterInMaster: jest.fn().mockResolvedValue({ deactivated: 0, errors: [] }),
      sendUserInformationApprovalNotification: jest.fn().mockResolvedValue({ sent: 0, failed: [] }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        detectedCount: 0,
        reporters: [],
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({ sent: 0, failed: [] }),
      retrieveNonSubmissionDetectionLogsByDate: jest.fn().mockResolvedValue({ logs: [] }),
    };

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions: [], executionTimestamp, targetDate },
      mockAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.nonSubmissionDetectionResult.detectedCount).toBe(0);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBe(0);
    expect(result.nonSubmissionDetectionResult.errors).toEqual([]);
    expect(result.userInformationProcessingResult.approved).toBe(0);
    expect(result.userInformationProcessingResult.rejected).toBe(0);
    expect(result.reporterMasterUpdateResult.registered).toBe(0);
    expect(result.reporterMasterUpdateResult.updated).toBe(0);
    expect(result.reporterMasterUpdateResult.deactivated).toBe(0);
    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(0);
    expect(result.notificationSendingResult.promptNotificationsSent).toBe(0);
    expect(result.exceptionCases).toEqual([]);
  });
});
