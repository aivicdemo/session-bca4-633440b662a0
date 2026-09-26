import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-submission');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { submitDailyReport, type SubmitDailyReportInput, DailyReportContentEmptyException } from '../../src/logic/daily-report-submission';

const mockedSubmitDailyReport = submitDailyReport as jest.MockedFunction<typeof submitDailyReport>;

describe('SCEN-203: 業務内容が空白の場合', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedSubmitDailyReport.mockRejectedValueOnce(
      new DailyReportContentEmptyException('日報内容を入力してください。')
    );
  });

  it('内容空エラーが発生して提出が拒否される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(DailyReportContentEmptyException);
    await expect(submitDailyReport(input)).rejects.toThrow('日報内容を入力してください。');

    expect(mockedSubmitDailyReport).toHaveBeenCalledTimes(2);
  });
});
