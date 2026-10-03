import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import type {
  RetrieveLeaderDashboardDataInput,
  RetrieveLeaderDashboardDataOutput,
} from '../../src/logic/daily-report-management-view';

const authenticateAndAuthorizeLeaderAccessMock = jest.fn() as jest.Mock<any>;
const judgeBusinessDayAndDeadlineMock = jest.fn() as jest.Mock<any>;
const retrieveDailyReportsForLeaderReviewMock = jest.fn() as jest.Mock<any>;
const retrieveNonSubmissionDetectionLogsByDateMock = jest.fn() as jest.Mock<any>;
const retrieveEmailSendingHistoryByDateRangeMock = jest.fn() as jest.Mock<any>;

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  authenticateAndAuthorizeLeaderAccess: authenticateAndAuthorizeLeaderAccessMock,
}));
jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  judgeBusinessDayAndDeadline: judgeBusinessDayAndDeadlineMock,
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
  retrieveDailyReportsForLeaderReview: retrieveDailyReportsForLeaderReviewMock,
  retrieveNonSubmissionDetectionLogsByDate: retrieveNonSubmissionDetectionLogsByDateMock,
}));
jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveEmailSendingHistoryByDateRange: retrieveEmailSendingHistoryByDateRangeMock,
}));

describe('SCEN-566: 提出済み日報の報告者名が登録されていない場合、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reporterName が null の場合、detectionLogs に警告ログが記録される', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    (authenticateAndAuthorizeLeaderAccessMock as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
    });

    (judgeBusinessDayAndDeadlineMock as jest.Mock<any>).mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
    });

    (retrieveDailyReportsForLeaderReviewMock as jest.Mock<any>).mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'report-001',
          userId: 'reporter-001',
          reportDate: '2024-01-15',
          businessContent: '本日の業務内容',
          submittedAt: '2024-01-15T14:30:00',
          achievements: '成果',
          challenges: '課題',
          tomorrowPlan: '明日',
          reporterName: null, // 報告者名が null
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00',
    });

    (retrieveNonSubmissionDetectionLogsByDateMock as jest.Mock<any>).mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:00:00',
    });

    (retrieveEmailSendingHistoryByDateRangeMock as jest.Mock<any>).mockResolvedValue({
      success: true,
      emailSendingHistories: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 100,
    });

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId,
      targetDate,
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output).toBeDefined();
    expect(output.detectionLogs).toBeDefined();
    expect(Array.isArray(output.detectionLogs)).toBe(true);

    // detectionLogs に警告ログが記録されていることを確認
    const warningLog = output.detectionLogs.find(
      (log: any) =>
        log.message === '報告者情報が見つかりません。ユーザーマスタを確認してください。' &&
        log.level === 'warn'
    );
    expect(warningLog).toBeDefined();
    expect(warningLog?.reportId).toBe('report-001');
  });

  it('reporterName が空文字列の場合、detectionLogs に警告ログが記録される', async () => {
    const leaderId = 'leader-001';
    const targetDate = '2024-01-15';

    (authenticateAndAuthorizeLeaderAccessMock as jest.Mock<any>).mockResolvedValue({
      isAccessGranted: true,
      userId: leaderId,
    });

    (judgeBusinessDayAndDeadlineMock as jest.Mock<any>).mockResolvedValue({
      isAcceptable: true,
      isBusinessDay: true,
      isWithinDeadline: true,
    });

    (retrieveDailyReportsForLeaderReviewMock as jest.Mock<any>).mockResolvedValue({
      dailyReports: [
        {
          dailyReportId: 'report-002',
          userId: 'reporter-002',
          reportDate: '2024-01-15',
          businessContent: '本日の業務内容',
          submittedAt: '2024-01-15T14:30:00',
          achievements: '成果',
          challenges: '課題',
          tomorrowPlan: '明日',
          reporterName: '', // 報告者名が空文字列
        },
      ],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 100,
      retrievedAt: '2024-01-15T17:00:00',
    });

    (retrieveNonSubmissionDetectionLogsByDateMock as jest.Mock<any>).mockResolvedValue({
      detectionLogs: [],
      totalCount: 0,
      retrievedAt: '2024-01-15T17:00:00',
    });

    (retrieveEmailSendingHistoryByDateRangeMock as jest.Mock<any>).mockResolvedValue({
      success: true,
      emailSendingHistories: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 100,
    });

    const input: RetrieveLeaderDashboardDataInput = {
      leaderId,
      targetDate,
    };

    const output: RetrieveLeaderDashboardDataOutput = await retrieveLeaderDashboardData(input);

    expect(output).toBeDefined();
    expect(output.detectionLogs).toBeDefined();
    expect(Array.isArray(output.detectionLogs)).toBe(true);

    // detectionLogs に警告ログが記録されていることを確認
    const warningLog = output.detectionLogs.find(
      (log: any) =>
        log.message === '報告者情報が見つかりません。ユーザーマスタを確認してください。' &&
        log.level === 'warn'
    );
    expect(warningLog).toBeDefined();
    expect(warningLog?.reportId).toBe('report-002');
  });
});
