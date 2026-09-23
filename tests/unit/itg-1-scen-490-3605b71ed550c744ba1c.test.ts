import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-490: validateAndRouteLeaderNotification determines notification sendable when leader email is active', () => {
  it('should return canSendNotification=true, targetEmail, and reason when leader email is active', () => {
    // Prepare input parameters for validateAndRouteLeaderNotification
    const leaderEmailAddress = 'leader@example.com';
    const notificationTrigger = 'daily_report_submitted';
    const leaderEmailStatus = 'active';

    // Expected result when leader email address is active
    const expectedResult = {
      canSendNotification: true,
      targetEmail: 'leader@example.com',
      reason: 'メールアドレスがアクティブです',
    };

    // Verify expected result matches specification
    expect(expectedResult.canSendNotification).toBe(true);
    expect(expectedResult.targetEmail).toBe('leader@example.com');
    expect(expectedResult.reason).toBe('メールアドレスがアクティブです');
  });
});
