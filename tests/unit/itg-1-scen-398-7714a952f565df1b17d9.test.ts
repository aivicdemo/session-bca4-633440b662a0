import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-398: メールアドレスがシステムに既に存在する場合、入力形式不正エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Duplicate email address throws InvalidUserInformationFormatError', () => {
    const now = new Date();

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'yamada-user',
      emailAddress: 'existing@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp: now,
    };

    (authenticateAndAuthorizeReporterAccess as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    });

    (validateUserInformationRequired as jest.Mock).mockReturnValue({
      isValid: true,
      validatedUserName: 'yamada-user',
      validatedEmailAddress: 'existing@example.com',
      validatedFullName: '山田太郎',
      validatedDepartment: '営業部',
    });

    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue({
      isDuplicate: true,
    });

    expect(() => {
      submitUserInformationForConfirmation(input);
    }).toThrow(InvalidUserInformationFormatError);

    expect(() => {
      submitUserInformationForConfirmation(input);
    }).toThrow('ユーザー情報の入力形式が不正です。必須項目を確認し、メールアドレスの重複がないか確認してください。');
  });
});
