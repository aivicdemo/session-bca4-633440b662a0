import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-submission');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { submitDailyReport, type SubmitDailyReportInput, ReporterNotEligibleForSubmissionException } from '../../src/logic/daily-report-submission';

const mockedSubmitDailyReport = submitDailyReport as jest.MockedFunction<typeof submitDailyReport>;

describe('SCEN-202: 報告者が提出対象外または無効化されている場合', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedSubmitDailyReport.mockRejectedValueOnce(
      new ReporterNotEligibleForSubmissionException('この報告者は日報提出対象外です。')
    );
  });

  it('提出資格なしエラーが発生して提出が拒否される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2024-01-15',
      businessContent: '本日の業務内容',
      achievements: null,
      challenges: null,
      tomorrowPlan: null,
      submissionTimestamp: '2024-01-15T14:30:00Z',
    };

    await expect(submitDailyReport(input)).rejects.toThrow(ReporterNotEligibleForSubmissionException);
    await expect(submitDailyReport(input)).rejects.toThrow('この報告者は日報提出対象外です。');

    expect(mockedSubmitDailyReport).toHaveBeenCalledTimes(2);
  });
});
