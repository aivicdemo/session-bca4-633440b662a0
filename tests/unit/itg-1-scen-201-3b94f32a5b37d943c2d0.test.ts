import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-submission');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { submitDailyReport, type SubmitDailyReportInput, ReporterNotAuthenticatedException } from '../../src/logic/daily-report-submission';

const mockedSubmitDailyReport = submitDailyReport as jest.MockedFunction<typeof submitDailyReport>;

describe('SCEN-201: 報告者が未認証またはアカウント無効の場合', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedSubmitDailyReport.mockRejectedValueOnce(
      new ReporterNotAuthenticatedException('報告者の認証に失敗しました。ログインしてください。')
    );
  });

  it('認証エラーが発生して提出が拒否される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-unauthenticated',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      submissionTimestamp: '2024-01-15T10:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotAuthenticatedException);
    await expect(submitDailyReport(input)).rejects.toThrow('報告者の認証に失敗しました。ログインしてください。');

    expect(mockedSubmitDailyReport).toHaveBeenCalledTimes(2);
  });
});
