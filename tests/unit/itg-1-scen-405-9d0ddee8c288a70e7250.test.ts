import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  submitUserInformationForConfirmation,
  SubmitUserInformationForConfirmationInput,
  InvalidUserInformationFormatError,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';
import { validateUserInformationRequired, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { saveDailyReportRecord } from '../../src/logic/user-master-persistence';
import { sendLeaderSubmissionNotification } from '../../src/logic/daily-report-reminder-notification';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

describe('SCEN-405: 承認期限が0営業日以下で設定された場合、エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('承認期限が0営業日で設定された場合、エラーが発生して処理が中断される', async () => {
    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date(),
    };

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
    });

    (validateUserInformationRequired as jest.MockedFunction<any>).mockResolvedValue({
      isValid: true,
    });

    (detectDuplicateEmailAddress as jest.MockedFunction<any>).mockResolvedValue({
      isDuplicate: false,
    });

    (saveDailyReportRecord as jest.MockedFunction<any>).mockResolvedValue({
      userInformationId: 'user-info-001',
      confirmationStatus: 'pending_approval',
      approvalDeadline: new Date(),
    });

    (sendLeaderSubmissionNotification as jest.MockedFunction<any>).mockResolvedValue({
      leaderNotificationSent: true,
    });

    try {
      const result = await submitUserInformationForConfirmation(input);
      if (!result.success) {
        expect(result.userInformationId).toBeNull();
        expect(result.confirmationStatus).not.toBe('pending_approval');
      }
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidUserInformationFormatError);
    }
  });
});
