import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type {
  RetrieveUserInformationConfirmationStatusInput,
  RetrieveUserInformationConfirmationStatusOutput,
} from '../../src/logic/user-information-input-confirmation';
import {
  retrieveUserInformationConfirmationStatus,
  buildUserInformationConfirmationStatusList,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-information-input-confirmation');

const mockAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.Mock;
const mockBuildUserInformationConfirmationStatusList = buildUserInformationConfirmationStatusList as jest.Mock;
const mockRetrieveUserInformationConfirmationStatus = retrieveUserInformationConfirmationStatus as jest.Mock;

describe('SCEN-418: 対象ユーザー情報が存在しない場合、各カテゴリが空配列で返され、totalCountが0になる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('各カテゴリが空配列で返され、totalCountが0になる', async () => {
    const leaderUserId = 'leader-001';
    const retrievalTimestamp = new Date('2026-09-24T10:00:00Z');

    // スタブ：authenticateAndAuthorizeLeaderAccess - 権限有効を返す
    (mockAuthenticateAndAuthorizeLeaderAccess as any).mockImplementation(async () => ({
      authorized: true,
    }));

    // スタブ：buildUserInformationConfirmationStatusList - 対象ユーザー情報がない状態
    (mockBuildUserInformationConfirmationStatusList as any).mockImplementation(async () => ({
      pendingApprovals: [],
      approvedRecords: [],
      expiredApprovals: [],
    }));

    const input = {
      leaderUserId,
      retrievalTimestamp,
    } as any;

    // 対象処理を呼び出す
    (mockRetrieveUserInformationConfirmationStatus as any).mockImplementation(async () => ({
      success: true,
      pendingApprovals: [],
      approvedRecords: [],
      expiredApprovals: [],
      totalCount: 0,
    }));

    const result = await mockRetrieveUserInformationConfirmationStatus(input) as RetrieveUserInformationConfirmationStatusOutput;

    // 期待結果の検証
    expect(result.success).toBe(true);
    expect(result.pendingApprovals).toHaveLength(0);
    expect(result.approvedRecords).toHaveLength(0);
    expect(result.expiredApprovals).toHaveLength(0);
    expect(result.totalCount).toBe(0);

    // 依存関数が呼ばれたことを確認
    expect(mockAuthenticateAndAuthorizeLeaderAccess).toHaveBeenCalled();
    expect(mockBuildUserInformationConfirmationStatusList).toHaveBeenCalled();
  });
});
