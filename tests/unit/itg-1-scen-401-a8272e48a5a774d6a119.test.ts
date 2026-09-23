import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  UserInformationSubmissionFailedError,
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

describe('SCEN-401: リーダーへの通知送信に失敗した場合、送信失敗エラーが発生する', () => {
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

  it('ユーザー情報は保存されたが、リーダーへの通知送信に失敗した場合、UserInformationSubmissionFailedErrorが発生する', async () => {
    const submissionTimestamp = new Date();
    const approvalDeadline = new Date(submissionTimestamp.getTime() + 3 * 24 * 60 * 60 * 1000);

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'tanaka-user',
      emailAddress: 'tanaka@example.com',
      fullName: '田中太郎',
      department: '営業部',
      submissionTimestamp,
    };

    (mockAuthenticateAndAuthorizeReporterAccess as any).mockResolvedValue(undefined);
    (mockValidateUserInformationRequired as any).mockResolvedValue(undefined);
    (mockDetectDuplicateEmailAddress as any).mockResolvedValue({ isDuplicate: false });
    (mockSaveDailyReportRecord as any).mockResolvedValue({
      userInformationId: 'info-12345',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });
    (mockSendLeaderSubmissionNotification as any).mockRejectedValue(
      new UserInformationSubmissionFailedError('ユーザー情報の送信に失敗しました。システム管理者に連絡してください。'),
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(UserInformationSubmissionFailedError);
  });
});
