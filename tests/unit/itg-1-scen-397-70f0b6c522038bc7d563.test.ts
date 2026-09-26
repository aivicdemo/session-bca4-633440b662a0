import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-397: ユーザー名が空文字列の場合、入力形式不正エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Empty userName throws InvalidUserInformationFormatError', async () => {
    const now = new Date();

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: '',
      emailAddress: 'user@example.com',
      fullName: '山田太郎',
      department: '営業部',
      submissionTimestamp: now,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockRejectedValue(
      new InvalidUserInformationFormatError(
        'ユーザー情報の入力形式が不正です。必須項目を確認し、メールアドレスの重複がないか確認してください。'
      )
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(InvalidUserInformationFormatError);
    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow('ユーザー情報の入力形式が不正です。必須項目を確認し、メールアドレスの重複がないか確認してください。');
  });
});
