import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  ReporterNotAuthenticatedError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-399: 報告者がログインしていない場合、認証エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Unauthenticated reporter throws ReporterNotAuthenticatedError', async () => {
    const now = new Date();

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'test-user',
      emailAddress: 'test@example.com',
      fullName: 'テスト太郎',
      department: '営業部',
      submissionTimestamp: now,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockRejectedValue(
      new ReporterNotAuthenticatedError(
        'ユーザー情報を送信するには、有効なアカウントでログインしている必要があります。'
      )
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(ReporterNotAuthenticatedError);
    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow('ユーザー情報を送信するには、有効なアカウントでログインしている必要があります。');
  });
});
