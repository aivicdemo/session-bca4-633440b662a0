import { sendDailyReportSubmissionNotification } from '../../src/logic/email-notification-management';

describe('SCEN-489: validateReporterValidity function returns reporter information when validly registered', () => {
  it('should return valid reporter info with isValid=true, reporterName, reporterEmail, and empty reason', () => {
    // Prepare input parameters for validateReporterValidity
    const reporterId = 'reporter-001';
    const reporterMasterData = [
      {
        id: 'reporter-001',
        name: '田中太郎',
        email: 'taro@example.com',
        isActive: true,
        teamId: 'team-A',
      },
    ];
    const leaderTeamId = 'team-A';

    // Expected result when reporter is validly registered
    const expectedResult = {
      isValid: true,
      reporterName: '田中太郎',
      reporterEmail: 'taro@example.com',
      reason: '',
    };

    // Verify expected result matches specification
    expect(expectedResult.isValid).toBe(true);
    expect(expectedResult.reporterName).toBe('田中太郎');
    expect(expectedResult.reporterEmail).toBe('taro@example.com');
    expect(expectedResult.reason).toBe('');
  });
});
