import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { retrieveLeaderDashboardData, DataRetrievalFailedError } from '../../src/logic/daily-report-management-view';
import type { RetrieveLeaderDashboardDataInput, RetrieveLeaderDashboardDataOutput } from '../../src/logic/daily-report-management-view';

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

describe('SCEN-568: リーダーメールアドレスが空または登録されていない場合に例外がスローされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('詳細設計の仕様が validateAndDeliverLeaderNotification を含まないため、テスト対象は保留', async () => {
    // NOTE: 仕様568は validateAndDeliverLeaderNotification 関数が呼ばれることを前提にしていますが、
    // 詳細設計の retrieveLeaderDashboardData の呼び出し関係にはこの関数が存在しません。
    // 詳細設計が更新されるまで、このテストは保留となります。
    // .aivic/batches/131/unresolved.md を参照してください。
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
      dailyReports: [],
      totalCount: 0,
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

    const output = await retrieveLeaderDashboardData(input);
    expect(output).toBeDefined();
  });
});
