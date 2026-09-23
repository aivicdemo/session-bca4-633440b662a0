import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  InvalidUserInformationFormatError,
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

describe('SCEN-398: メールアドレスがシステムに既に存在する場合、入力形式不正エラーが発生する', () => {
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

  it('メールアドレスが既にシステムに登録されている場合、InvalidUserInformationFormatErrorが発生する', async () => {
    const submissionTimestamp = new Date();

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'test-user',
      emailAddress: 'existing@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp,
    };

    (mockAuthenticateAndAuthorizeReporterAccess as any).mockResolvedValue(undefined);
    (mockValidateUserInformationRequired as any).mockResolvedValue(undefined);
    (mockDetectDuplicateEmailAddress as any).mockRejectedValue(
      new InvalidUserInformationFormatError('ユーザー情報の入力形式が不正です。必須項目を確認し、メールアドレスの重複がないか確認してください。'),
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(InvalidUserInformationFormatError);
  });
});
