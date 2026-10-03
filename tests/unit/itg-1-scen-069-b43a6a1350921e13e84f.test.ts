import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';
import * as userAuthLogic from '../../src/logic/user-authentication-authorization';
import * as inputValidationLogic from '../../src/logic/input-validation-formatting';
import * as userInfoConfirmationLogic from '../../src/logic/user-information-input-confirmation';
import * as reporterMasterLogic from '../../src/logic/reporter-master-management';
import * as userMasterPersistenceLogic from '../../src/logic/user-master-persistence';
import * as emailNotificationLogic from '../../src/logic/email-notification-management';
import * as nonSubmissionDetectionLogic from '../../src/logic/daily-report-non-submission-detection';
import * as nonSubmissionPromptLogic from '../../src/logic/daily-report-reminder-notification';

describe('SCEN-069: 一部のユーザー情報処理が成功し一部が失敗した場合', () => {
  let mockAiClient: Tx6Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx6Imp1AiClient;

    jest.spyOn(userAuthLogic, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader001',
    });
    jest.spyOn(inputValidationLogic, 'validateUserInformationRequired').mockResolvedValue({
      isValid: true,
      validatedUserName: 'name',
      validatedEmailAddress: 'email@example.com',
      validatedDepartment: 'dept',
      errorCode: null,
    });
    jest.spyOn(inputValidationLogic, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: true,
      validatedEmailAddress: 'duplicate@example.com',
      errorCode: 'DUPLICATE_EMAIL',
    });
    jest.spyOn(userInfoConfirmationLogic, 'submitUserInformationForConfirmation').mockResolvedValue({
      success: true,
      userInformationId: 'sub-001',
      confirmationStatus: 'submitted',
      leaderNotificationSent: true,
      approvalDeadline: new Date('2024-01-22T10:00:00Z'),
    });
    jest.spyOn(userInfoConfirmationLogic, 'confirmAndApproveUserInformation').mockResolvedValue({
      success: true,
      approvalDecision: 'approve',
      reporterUserId: 'user001',
      approvalNotificationSent: true,
      reporterMasterRegistered: true,
      processedTimestamp: new Date('2024-01-15T10:00:00Z'),
    });
    jest.spyOn(reporterMasterLogic, 'registerReporter').mockResolvedValue({
      success: true,
      reporterId: 'rep-001',
      message: 'Reporter registered',
      changeHistoryId: 'hist-001',
    });
    jest.spyOn(reporterMasterLogic, 'updateReporter').mockResolvedValue({
      success: true,
      reporterId: 'rep-002',
      message: 'Reporter updated',
      changeHistoryId: 'hist-002',
    });
    jest.spyOn(reporterMasterLogic, 'deactivateReporter').mockResolvedValue({
      success: true,
      reporterId: 'rep-003',
      archivedReportCount: 0,
      message: 'Reporter deactivated',
      changeHistoryId: 'hist-003',
    });
    jest.spyOn(userMasterPersistenceLogic, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: 'rep-004',
      message: 'Reporter registered to master',
    });
    jest.spyOn(userMasterPersistenceLogic, 'updateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: 'rep-005',
      message: 'Reporter updated in master',
    });
    jest.spyOn(userMasterPersistenceLogic, 'deactivateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: 'rep-006',
      message: 'Reporter deactivated in master',
    });
    jest.spyOn(emailNotificationLogic, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'notif-001',
      sentAt: '2024-01-15T10:00:00Z',
      errorMessage: null,
      adminNotificationSent: true,
    });
    jest.spyOn(nonSubmissionDetectionLogic, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [],
      detectionLog: { detectionLogId: 'det-001', targetDate: '2024-01-15', detectionDateTime: '2024-01-15T10:00:00Z', totalReportersCount: 0, nonSubmittedCount: 0, submittedCount: 0 },
      detectionTimestamp: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(nonSubmissionPromptLogic, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
      notificationId: 'prompt-001',
      sentAt: new Date('2024-01-15T10:00:00Z'),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 0,
      errorDetails: null,
    });
  });

  it('should return partial_failure status with error details for invalid users', async () => {
    const leaderUserId = 'leader001';
    const userInformationSubmissions = [
      { userId: 'user001', userName: 'valid1', email: 'valid1@example.com', department: 'sales', role: 'rep' },
      { userId: 'user002', userName: 'valid2', email: 'valid2@example.com', department: 'marketing', role: 'mgr' },
      { userId: 'user003', userName: 'valid3', email: 'valid3@example.com', department: 'ops', role: 'admin' },
      { userId: 'user004', userName: 'invalid1', email: 'duplicate@example.com', department: '', role: '' },
      { userId: 'user005', userName: 'invalid2', email: 'duplicate@example.com', department: 'dev', role: '' },
    ];
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const targetDate = new Date('2024-01-15');

    const result = await runTx6Imp1Agent(
      {
        leaderUserId,
        userInformationSubmissions,
        executionTimestamp,
        targetDate,
      },
      mockAiClient
    );

    expect(result.executionStatus).toBe('partial_failure');
    expect(result.userInformationProcessingResult.approved).toBe(3);
    expect(result.userInformationProcessingResult.rejected).toBe(0);
    expect(result.userInformationProcessingResult.errors).toHaveLength(2);
    expect(result.userInformationProcessingResult.errors.every((e: any) => e.userId && e.reason)).toBe(true);
    expect(result.reporterMasterUpdateResult.registered + result.reporterMasterUpdateResult.updated + result.reporterMasterUpdateResult.deactivated).toBe(3);
    expect(result.reporterMasterUpdateResult.errors).toEqual([]);
    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(3);
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);
    expect(result.nonSubmissionDetectionResult.detectedCount).toBeGreaterThanOrEqual(0);
    expect(result.nonSubmissionDetectionResult.promptedCount).toBeGreaterThanOrEqual(0);
    expect(result.exceptionCases).toEqual([]);
    expect(result.executionLog).toBeTruthy();
  });
});
