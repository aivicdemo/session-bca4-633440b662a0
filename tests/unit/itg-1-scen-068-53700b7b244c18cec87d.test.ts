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

describe('SCEN-068: AIエージェントが人事異動による報告者マスタ更新を実行', () => {
  let mockAiClient: Tx6Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {} as Tx6Imp1AiClient;

    jest.spyOn(userAuthLogic, 'authenticateAndAuthorizeLeaderAccess').mockResolvedValue({
      isAccessGranted: true,
      userId: 'leader001',
    });
    jest.spyOn(inputValidationLogic, 'validateUserInformationRequired').mockResolvedValue({
      isValid: true,
      validatedUserName: '新入社員',
      validatedEmailAddress: 'new@example.com',
      validatedDepartment: 'sales',
      errorCode: null,
    });
    jest.spyOn(inputValidationLogic, 'detectDuplicateEmailAddress').mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'test@example.com',
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
      detectionLog: { detectionLogId: 'det-001', targetDate: '2024-01-15', detectionDateTime: '2024-01-15T10:00:00Z', totalReportersCount: 3, nonSubmittedCount: 3, submittedCount: 0 },
      detectionTimestamp: '2024-01-15T10:00:00Z',
    });
    jest.spyOn(nonSubmissionPromptLogic, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true,
      notificationId: 'prompt-001',
      sentAt: new Date('2024-01-15T10:00:00Z'),
      deliveryMethod: 'email',
      nonSubmittedReporterCount: 3,
      errorDetails: null,
    });
    jest.spyOn(nonSubmissionPersistenceLogic, 'retrieveNonSubmissionDetectionLogsByDate').mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T10:00:00Z',
    });
  });

  it('should complete agent execution with all user information processing steps and exception cases recorded', async () => {
    const leaderUserId = 'leader001';
    const userInformationSubmissions = [
      { userId: 'user001', userName: '新入社員', email: 'new@example.com', department: 'sales', role: 'new' },
      { userId: 'user002', userName: '異動者', email: 'transferred@example.com', department: 'marketing', role: 'sales_rep' },
      { userId: 'user003', userName: '退職者', email: 'retired@example.com', department: 'ops', role: 'inactive' },
      { userId: 'user004', userName: '配置変更者', email: 'reallocated@example.com', department: 'dev', role: 'developer' },
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

    expect(result.executionStatus).toBe('success');
    expect(result.userInformationProcessingResult).toEqual({
      approved: 3,
      rejected: 1,
      errors: [],
    });
    expect(result.reporterMasterUpdateResult).toEqual({
      registered: 1,
      updated: 2,
      deactivated: 1,
      errors: [],
    });
    expect(result.nonSubmissionDetectionResult).toEqual({
      detectedCount: 3,
      promptedCount: 3,
      errors: [],
    });
    expect(result.notificationSendingResult).toEqual({
      approvalNotificationsSent: 3,
      promptNotificationsSent: 3,
      failedNotifications: [],
    });
    expect(result.exceptionCases).toHaveLength(3);
    expect(result.exceptionCases.every((c: any) => c.caseId && c.description && c.requiredLeaderAction)).toBe(true);
    expect(result.executionLog).toBeTruthy();
  });
});
