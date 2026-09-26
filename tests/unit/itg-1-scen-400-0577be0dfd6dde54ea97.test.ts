import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  UserInformationSubmissionFailedError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { saveDailyReportRecord } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-400: ユーザー情報の保存に失敗した場合、送信失敗エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Failed saveDailyReportRecord throws UserInformationSubmissionFailedError', async () => {
    const now = new Date();

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'tanaka',
      emailAddress: 'test@example.com',
      fullName: '田中太郎',
      department: '営業部',
      submissionTimestamp: now,
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
      validatedUserName: 'tanaka',
      validatedEmailAddress: 'test@example.com',
      validatedFullName: '田中太郎',
      validatedDepartment: '営業部',
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    (saveDailyReportRecord as jest.MockedFunction<any>).mockRejectedValue(
      new UserInformationSubmissionFailedError(
        'ユーザー情報の送信に失敗しました。システム管理者に連絡してください。'
      )
    );

    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow(UserInformationSubmissionFailedError);
    await expect(submitUserInformationForConfirmation(input)).rejects.toThrow('ユーザー情報の送信に失敗しました。システム管理者に連絡してください。');
  });
});
