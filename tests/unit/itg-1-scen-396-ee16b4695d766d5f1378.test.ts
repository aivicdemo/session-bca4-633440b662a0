import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
  InvalidUserInformationFormatError,
  ReporterNotAuthenticatedError,
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

describe('SCEN-396: 報告者が有効なアカウントで必須項目をすべて正しく入力してユーザー情報を送信すると、一意のIDが割り当てられ確認待ち状態になり、リーダーに通知される', () => {
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

  it('正常系: 全必須項目を正しく入力して送信すると、一意のIDが割り当てられ確認待ち状態になり、リーダーに通知される', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00');
    const approvalDeadline = new Date('2024-01-08T23:59:59');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-name-001',
      emailAddress: 'reporter@example.com',
      fullName: '田中太郎',
      department: '営業部',
      submissionTimestamp,
    };

    (mockAuthenticateAndAuthorizeReporterAccess as any).mockResolvedValue(undefined);
    (mockValidateUserInformationRequired as any).mockResolvedValue(undefined);
    (mockDetectDuplicateEmailAddress as any).mockResolvedValue({ isDuplicate: false });
    (mockSaveDailyReportRecord as any).mockResolvedValue({
      userInformationId: 'user-info-2024-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });
    (mockSendLeaderSubmissionNotification as any).mockResolvedValue(undefined);

    const result = await submitUserInformationForConfirmation(input);

    expect(mockAuthenticateAndAuthorizeReporterAccess).toHaveBeenCalledWith('reporter-001');
    expect(mockValidateUserInformationRequired).toHaveBeenCalledWith({
      userName: 'user-name-001',
      emailAddress: 'reporter@example.com',
      fullName: '田中太郎',
      department: '営業部',
    });
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith('reporter@example.com');
    expect(mockSaveDailyReportRecord).toHaveBeenCalled();
    expect(mockSendLeaderSubmissionNotification).toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      userInformationId: 'user-info-2024-001',
      confirmationStatus: 'pending_approval',
      leaderNotificationSent: true,
      approvalDeadline,
    });
  });
});
