import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  LeaderAuthorizationFailedError,
  RetrieveLeaderDashboardDataInput,
} from '../../src/logic/daily-report-management-view';
import {
  authenticateAndAuthorizeLeaderAccess,
} from '../../src/logic/user-authentication-authorization';
import {
  judgeBusinessDayAndDeadline,
} from '../../src/logic/business-day-deadline-judgment';
import {
  retrieveDailyReportsForLeaderReview,
  retrieveNonSubmissionDetectionLogsByDate,
} from '../../src/logic/daily-report-persistence';
import {
  retrieveEmailSendingHistoryByDateRange,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-560: リーダーの認証・認可に失敗した場合、「リーダーとしてのアクセス権限がありません。」というエラーが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;
  let mockRetrieveNonSubmissionDetectionLogsByDate: jest.Mock;
  let mockRetrieveEmailSendingHistoryByDateRange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline = judgeBusinessDayAndDeadline as jest.Mock;
    mockRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;
    mockRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;
    mockRetrieveEmailSendingHistoryByDateRange = retrieveEmailSendingHistoryByDateRange as jest.Mock;

    // 認証・認可が失敗（リーダー権限なし）
    mockAuthenticateAndAuthorizeLeaderAccess.mockRejectedValue(
      // @ts-ignore
      new LeaderAuthorizationFailedError('リーダーとしてのアクセス権限がありません。')
    );

    // 以下のモックは呼ばれないことを期待
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
      withinDeadline: true,
    });

    // @ts-ignore
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue({
      reports: [],
    });

    // @ts-ignore
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      logs: [],
    });

    // @ts-ignore
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue({
      histories: [],
    });
  });

  it('LeaderAuthorizationFailedError が throw され、エラーメッセージが「リーダーとしてのアクセス権限がありません。」である', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader_invalid_id',
      targetDate: '2024-01-15',
    };

    // retrieveLeaderDashboardData 関数を実行し、エラーが発生することを期待
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(LeaderAuthorizationFailedError);

    // エラーメッセージを確認
    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow('リーダーとしてのアクセス権限がありません。');

    // 認証・認可が呼ばれたことを確認
    expect(mockAuthenticateAndAuthorizeLeaderAccess).toHaveBeenCalledWith(
      expect.objectContaining({ leaderId: 'leader_invalid_id' })
    );

    // 認証・認可失敗時は営業日判定は呼ばれない
    expect(mockJudgeBusinessDayAndDeadline).not.toHaveBeenCalled();

    // データ取得関数は呼ばれない
    expect(mockRetrieveDailyReportsForLeaderReview).not.toHaveBeenCalled();
    expect(mockRetrieveNonSubmissionDetectionLogsByDate).not.toHaveBeenCalled();
    expect(mockRetrieveEmailSendingHistoryByDateRange).not.toHaveBeenCalled();
  });
});
