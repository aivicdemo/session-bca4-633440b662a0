jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeReporterAccess: jest.fn(),
}));

import { submitDailyReport, SubmitDailyReportInput, DailyReportContentExceedsMaxLengthException } from '../../src/logic/daily-report-submission';
import { authenticateAndAuthorizeReporterAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeReporterAccess = authenticateAndAuthorizeReporterAccess as jest.Mock;

describe('SCEN-220: 業務ルール validateAndRecordDailyReportSubmission で報告内容が500文字を超える場合に制限される', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedAuthenticateAndAuthorizeReporterAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: 'reporter-001',
    });
  });

  it('businessContent が501文字を超える場合、DailyReportContentExceedsMaxLengthException がスローされる', async () => {
    const content = 'a'.repeat(501);
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: content,
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentExceedsMaxLengthException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容が長すぎます。');
  });
});
