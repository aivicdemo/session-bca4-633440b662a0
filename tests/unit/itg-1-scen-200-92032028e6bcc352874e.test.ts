import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/daily-report-submission');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { submitDailyReport, type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-submission';

const mockedSubmitDailyReport = submitDailyReport as jest.MockedFunction<typeof submitDailyReport>;

describe('SCEN-200: 報告者が認証済みで提出資格があり、業務内容が有効で、期限内に初回提出した場合', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedSubmitDailyReport.mockResolvedValueOnce({
      dailyReportId: 'report-uuid-12345',
      userId: 'reporter-001',
      reportDate: '2025-01-15',
      submissionTimestamp: '2025-01-15T16:30:00Z',
      submissionStatus: 'within_deadline',
      notificationTriggered: true,
      completionMessage: '日報が正常に保存されました。リーダーへの通知を送信しました。',
    });
  });

  it('日報が保存され提出完了となりリーダー通知が発火する', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'reporter-001',
      reportDate: '2025-01-15',
      businessContent: '本日は顧客A社のヒアリングを実施し、要件定義ドキュメントを初版作成した',
      achievements: '要件定義ドキュメント初版完成',
      challenges: '追加質問への回答待ち',
      tomorrowPlan: '顧客回答確認、レビュー準備',
      submissionTimestamp: '2025-01-15T16:30:00Z',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result.dailyReportId).toBe('report-uuid-12345');
    expect(result.userId).toBe('reporter-001');
    expect(result.reportDate).toBe('2025-01-15');
    expect(result.submissionTimestamp).toBe('2025-01-15T16:30:00Z');
    expect(result.submissionStatus).toBe('within_deadline');
    expect(result.notificationTriggered).toBe(true);
    expect(result.completionMessage).toContain('日報が正常に保存されました。リーダーへの通知を送信しました。');

    expect(mockedSubmitDailyReport).toHaveBeenCalledTimes(1);
  });
});
