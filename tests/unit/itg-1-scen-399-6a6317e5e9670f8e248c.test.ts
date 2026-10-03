import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  ReporterNotAuthenticatedError,
} from '../../src/logic/user-information-input-confirmation';
import * as userAuthModule from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-399: 報告者がログインしていない場合、認証エラーが発生する', () => {
  const mockAuthenticateAndAuthorizeReporterAccess = userAuthModule.authenticateAndAuthorizeReporterAccess as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Unauthenticated reporter throws ReporterNotAuthenticatedError', async () => {
    const submissionTimestamp = new Date('2024-01-05T09:00:00Z');

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'test-user',
      emailAddress: 'test@example.com',
      fullName: 'テスト太郎',
      department: '営業部',
      submissionTimestamp,
    };

    mockAuthenticateAndAuthorizeReporterAccess.mockRejectedValue(
      new ReporterNotAuthenticatedError(
        'ユーザー情報を送信するには、有効なアカウントでログインしている必要があります。'
      )
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(ReporterNotAuthenticatedError);
    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow('ユーザー情報を送信するには、有効なアカウントでログインしている必要があります。');
  });
});
