import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';
import * as inputValidationModule from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-397: ユーザー名が空文字列の場合、入力形式不正エラーが発生する', () => {
  const mockAuthenticateAndAuthorizeReporterAccess = userAuthModule.authenticateAndAuthorizeReporterAccess as jest.Mock;
  const mockValidateUserInformationRequired = inputValidationModule.validateUserInformationRequired as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Empty userName throws InvalidUserInformationFormatError', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00Z');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: '',
      emailAddress: 'user@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp,
    };

    mockAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });

    mockValidateUserInformationRequired.mockResolvedValue({
      isValid: false,
      validatedUserName: null,
      validatedEmailAddress: null,
      validatedDepartment: null,
      errorCode: 'MISSING_USERNAME',
      errorDetails: [{ field: 'userName', errorCode: 'REQUIRED' }],
    });

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(InvalidUserInformationFormatError);
    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow('ユーザー情報の入力形式が不正です。必須項目を確認し、メールアドレスの重複がないか確認してください。');
  });
});
