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
import * as nonSubmissionPersistenceLogic from '../../src/logic/daily-report-persistence';

describe('SCEN-071: targetDateで指定された営業日に未提出者が0人の場合、nonSubmissionDetectionResultのdetectedCountが0で出力される', () => {
  let mockAiClient: Tx6Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx6Imp1AiClient;

    jest.spyOn(userAuthLogic, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader001',
    });
    jest.spyOn(inputValidationLogic, 'validateUserInformationRequired').mockResolvedValue({
      isValid: true,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: null,
    });
    jest.spyOn(inputValidationLogic, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: null,
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
      approvalDecision: null,
      reporterUserId: null,
      approvalNotificationSent: false,
      reporterMasterRegistered: false,
      processedTimestamp: new Date('2024-01-15T10:00:00Z'),
    });
    jest.spyOn(reporterMasterLogic, 'registerReporter').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'No reporters to register',
      changeHistoryId: null,
    });
    jest.spyOn(reporterMasterLogic, 'updateReporter').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'No reporters to update',
      changeHistoryId: null,
    });
    jest.spyOn(reporterMasterLogic, 'deactivateReporter').mockResolvedValue({
      success: true,
      reporterId: null,
      archivedReportCount: 0,
      message: 'No reporters to deactivate',
      changeHistoryId: null,
    });
    jest.spyOn(userMasterPersistenceLogic, 'registerReporterToMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'No reporters to register to master',
    });
    jest.spyOn(userMasterPersistenceLogic, 'updateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'No reporters to update in master',
    });
    jest.spyOn(userMasterPersistenceLogic, 'deactivateReporterInMaster').mockResolvedValue({
      success: true,
      reporterId: null,
      message: 'No reporters to deactivate in master',
    });
    jest.spyOn(emailNotificationLogic, 'sendUserInformationApprovalNotification').mockResolvedValue({
      success: true,
      emailSendingHistoryId: null,
      sentAt: null,
      errorMessage: null,
      adminNotificationSent: false,
    });
    jest.spyOn(nonSubmissionDetectionLogic, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      nonSubmittedReporters: [],
      detectionLog: { detectionLogId: 'det-001', targetDate: '2024-01-15', detectionDateTime: '2024-01-15T10:00:00Z', totalReportersCount: 0, nonSubmittedCount: 0, submittedCount: 0 },
      detectionTimestamp: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(nonSubmissionPromptLogic, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
      notificationId: null,
      sentAt: null,
      deliveryMethod: null,
      nonSubmittedReporterCount: 0,
      errorDetails: null,
    });
    jest.spyOn(nonSubmissionPersistenceLogic, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T10:00:00Z',
    });
  });

  it('should return zero detectedCount when no non-submitted reporters on target date', async () => {
    const leaderUserId = 'leader001';
    const userInformationSubmissions: any[] = [];
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const targetDate = new Date('2024-01-15');

    const result = await runTx6Imp1Agent(
      { leaderUserId, userInformationSubmissions, executionTimestamp, targetDate },
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
    expect(result.notificationSendingResult.failedNotifications).toEqual([]);
    expect(result.exceptionCases).toEqual([]);
  });
});
