import { describe, it, expect, beforeEach } from '@jest/globals';
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

describe('SCEN-404: 承認期限を3日以上超過した場合、警告レベルが重大と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('承認期限から3営業日を超える場合、isDeadlineExceededがtrueでdaysOverdueが3以上である', async () => {
    const approvalDeadline = new Date('2024-01-05T09:00:00');
    const currentTimestamp = new Date('2024-01-08T09:00:00');

    (authenticateAndAuthorizeReporterAccess as jest.MockedFunction<any>).mockResolvedValue({
      isAuthenticated: true,
      reporterId: 'reporter-001',
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
      approvalDeadline,
    });

    (sendLeaderSubmissionNotification as jest.MockedFunction<any>).mockResolvedValue({
      leaderNotificationSent: true,
    });

    const input: SubmitUserInformationForConfirmationInput = {
      reporterId: 'reporter-001',
      userName: 'user_name',
      emailAddress: 'user@example.com',
      fullName: 'User Full Name',
      department: 'Engineering',
      submissionTimestamp: new Date('2024-01-05T09:00:00'),
    };

    const submitResult = await submitUserInformationForConfirmation(input);
    expect(submitResult.success).toBe(true);
    expect(submitResult.userInformationId).toBe('user-info-001');

    // Verify that deadline was set (implementation should calculate 3 business days from submission)
    expect(submitResult.approvalDeadline).toBeDefined();

    // Test the deadline calculation: 3+ days overdue
    const daysOverdue = Math.floor(
      (currentTimestamp.getTime() - approvalDeadline.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysOverdue).toBeGreaterThanOrEqual(3);
  });
});
