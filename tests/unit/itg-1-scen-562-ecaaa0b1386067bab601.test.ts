import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  DataRetrievalFailedError,
} from '../../src/logic/daily-report-management-view';
import {
  authenticateAndAuthorizeLeaderAccess,
} from '../../src/logic/user-authentication-authorization';
import {
  judgeBusinessDayAndDeadline,
} from '../../src/logic/business-day-deadline-judgment';
import {
  retrieveDailyReportsForLeaderReview,
} from '../../src/logic/daily-report-persistence';

// 依存先のモック
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-562: 日報、検知ログ、メール送信履歴の取得に失敗した場合、「管理画面データの取得に失敗しました。」というエラーが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;
  let mockRetrieveDailyReportsForLeaderReview: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess =
      authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline =
      judgeBusinessDayAndDeadline as jest.Mock;
    mockRetrieveDailyReportsForLeaderReview =
      retrieveDailyReportsForLeaderReview as jest.Mock;

    // authenticateAndAuthorizeLeaderAccess を成功状態で設定
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthorized: true,
    });

    // judgeBusinessDayAndDeadline を成功状態で設定
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: true,
    });

    // retrieveDailyReportsForLeaderReview をエラー状態で設定
    mockRetrieveDailyReportsForLeaderReview.mockRejectedValue(
      // @ts-ignore
      new DataRetrievalFailedError('管理画面データの取得に失敗しました。')
    );
  });

  it('日報取得に失敗した場合、DataRetrievalFailedError が発生し、「管理画面データの取得に失敗しました。」が返される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2025-01-15',
    };

    // 実行してエラーをキャッチ
    let thrownError: Error | null = null;
    try {
      // @ts-ignore
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // DataRetrievalFailedError が発生したことを検証
    expect(thrownError).toBeInstanceOf(DataRetrievalFailedError);

    // エラー文言が「管理画面データの取得に失敗しました。」であることを検証
    expect(thrownError?.message).toBe('管理画面データの取得に失敗しました。');

    // 出力型 RetrieveLeaderDashboardDataOutput が返されていないことを検証
    expect(thrownError).toBeDefined();
  });
});
