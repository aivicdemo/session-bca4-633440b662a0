import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveLeaderDashboardData,
  RetrieveLeaderDashboardDataInput,
  TargetDateInvalidError,
} from '../../src/logic/daily-report-management-view';
import {
  authenticateAndAuthorizeLeaderAccess,
} from '../../src/logic/user-authentication-authorization';
import {
  judgeBusinessDayAndDeadline,
} from '../../src/logic/business-day-deadline-judgment';

// 依存先のモック
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/business-day-deadline-judgment.ts');
jest.mock('../../src/logic/daily-report-persistence.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-561: 指定された対象日付が営業日判定に失敗した場合、「指定された日付は無効です。」というエラーが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockJudgeBusinessDayAndDeadline: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess =
      authenticateAndAuthorizeLeaderAccess as jest.Mock;
    mockJudgeBusinessDayAndDeadline =
      judgeBusinessDayAndDeadline as jest.Mock;

    // authenticateAndAuthorizeLeaderAccess を成功状態で設定
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAuthorized: true,
    });

    // judgeBusinessDayAndDeadline を失敗状態で設定（営業日判定失敗）
    // @ts-ignore
    mockJudgeBusinessDayAndDeadline.mockResolvedValue({
      isBusinessDay: false,
    });
  });

  it('営業日判定に失敗した場合、TargetDateInvalidError が発生し、「指定された日付は無効です。」が返される', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2024-02-30', // 無効な日付
    };

    // 実行してエラーをキャッチ
    let thrownError: Error | null = null;
    try {
      // @ts-ignore
      await retrieveLeaderDashboardData(input);
    } catch (error) {
      thrownError = error as Error;
    }

    // TargetDateInvalidError が発生したことを検証
    expect(thrownError).toBeInstanceOf(TargetDateInvalidError);

    // エラー文言が「指定された日付は無効です。」であることを検証
    expect(thrownError?.message).toBe('指定された日付は無効です。');

    // 出力型 RetrieveLeaderDashboardDataOutput が返されていないことを検証
    // エラーがスローされているため、正常な出力は返されない
    expect(thrownError).toBeDefined();
  });
});
