import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateUserInformationRequired: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  saveDailyReportRecord: jest.fn(),
}));

jest.mock('../../src/logic/daily-report-reminder-notification.ts', () => ({
  sendLeaderSubmissionNotification: jest.fn(),
}));

describe('SCEN-402: リーダーへの通知日時から営業日ベースで承認期限を経過していない場合、警告レベルが通常と判定される', () => {
  let mockAuthenticateAndAuthorizeReporterAccess: jest.Mock;
  let mockValidateUserInformationRequired: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockSaveDailyReportRecord: jest.Mock;
  let mockSendLeaderSubmissionNotification: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const auth = require('../../src/logic/user-authentication-authorization.ts');
    const validation = require('../../src/logic/input-validation-formatting.ts');
    const persistence = require('../../src/logic/user-master-persistence.ts');
    const notification = require('../../src/logic/daily-report-reminder-notification.ts');

    mockAuthenticateAndAuthorizeReporterAccess = auth.authenticateAndAuthorizeReporterAccess as jest.Mock;
    mockValidateUserInformationRequired = validation.validateUserInformationRequired as jest.Mock;
    mockDetectDuplicateEmailAddress = validation.detectDuplicateEmailAddress as jest.Mock;
    mockSaveDailyReportRecord = persistence.saveDailyReportRecord as jest.Mock;
    mockSendLeaderSubmissionNotification = notification.sendLeaderSubmissionNotification as jest.Mock;
  });

  it('承認期限を経過していない場合、警告レベルが通常と判定される', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00');
    const approvalDeadline = new Date('2024-01-08T23:59:59');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-001',
      emailAddress: 'user@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp,
    };

    (mockAuthenticateAndAuthorizeReporterAccess as any).mockResolvedValue(undefined);
    (mockValidateUserInformationRequired as any).mockResolvedValue(undefined);
    (mockDetectDuplicateEmailAddress as any).mockResolvedValue({ isDuplicate: false });
    (mockSaveDailyReportRecord as any).mockResolvedValue({
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });
    (mockSendLeaderSubmissionNotification as any).mockResolvedValue(undefined);

    const result: SubmitUserInformationForConfirmationOutput = await submitUserInformationForConfirmation(input);

    expect(result.success).toBe(true);
    expect(result.userInformationId).toBe('user-info-001');
    expect(result.confirmationStatus).toBe('pending_approval');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.approvalDeadline).toEqual(approvalDeadline);
  });
});
