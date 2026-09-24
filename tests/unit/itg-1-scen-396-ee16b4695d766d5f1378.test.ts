import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  SubmitUserInformationForConfirmationOutput,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { saveDailyReportRecord } from '../../src/logic/user-master-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-396: 報告者が有効なアカウントで必須項目をすべて正しく入力してユーザー情報を送信すると、一意のIDが割り当てられ確認待ち状態になり、リーダーに通知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Valid input returns success with userInformationId, confirmationStatus, leaderNotificationSent, and approvalDeadline', () => {
    const now = new Date();
    const approvalDeadline = new Date(now);
    approvalDeadline.setDate(approvalDeadline.getDate() + 3);

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user-name-001',
      emailAddress: 'reporter@example.com',
      fullName: '田中太郎',
      department: '営業部',
      submissionTimestamp: now,
    };

    (authenticateAndAuthorizeReporterAccess as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
    });

    (validateUserInformationRequired as jest.Mock).mockReturnValue({
      isValid: true,
      validatedUserName: 'user-name-001',
      validatedEmailAddress: 'reporter@example.com',
      validatedFullName: '田中太郎',
      validatedDepartment: '営業部',
    });

    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue({
      isDuplicate: false,
    });

    (saveDailyReportRecord as jest.Mock).mockReturnValue({
      userInformationId: 'user-info-2024-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline,
    });

    (sendLeaderSubmissionNotification as jest.Mock).mockReturnValue({
      leaderNotificationSent: true,
    });

    const result: SubmitUserInformationForConfirmationOutput = submitUserInformationForConfirmation(input);

    expect(result.success).toBe(true);
    expect(result.userInformationId).toBe('user-info-2024-001');
    expect(result.confirmationStatus).toBe('pending_approval');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.approvalDeadline).toEqual(approvalDeadline);
  });
});
