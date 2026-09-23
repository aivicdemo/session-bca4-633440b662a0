import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveUserInformationConfirmationStatus,
  buildUserInformationConfirmationStatusList,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

jest.mock('../../src/logic/user-information-input-confirmation.ts');

describe('SCEN-418: 対象ユーザー情報が存在しない場合、各カテゴリが空配列で返され、totalCountが0になる', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockBuildUserInformationConfirmationStatusList: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts').authenticateAndAuthorizeLeaderAccess;
    mockBuildUserInformationConfirmationStatusList = require('../../src/logic/user-information-input-confirmation.ts').buildUserInformationConfirmationStatusList;

    // リーダー権限チェックを成功させる
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ authorized: true });

    // 対象ユーザー情報がない状態を返す
    // @ts-ignore
    mockBuildUserInformationConfirmationStatusList.mockResolvedValue({
      pendingApprovals: [],
      approvedRecords: [],
      expiredApprovals: [],
      totalCount: 0,
    });
  });

  it('対象ユーザー情報が存在しない場合、各カテゴリが空配列で返され、totalCountが0になる', async () => {
    const input = {
      leaderUserId: 'leader-001',
      retrievalTimestamp: new Date(),
    };

    // @ts-ignore
    const result = await retrieveUserInformationConfirmationStatus(input);

    // 出力値の検証
    expect(result.success).toBe(true);

    expect(result.pendingApprovals).toBeDefined();
    expect(Array.isArray(result.pendingApprovals)).toBe(true);
    expect(result.pendingApprovals.length).toBe(0);

    expect(result.approvedRecords).toBeDefined();
    expect(Array.isArray(result.approvedRecords)).toBe(true);
    expect(result.approvedRecords.length).toBe(0);

    expect(result.expiredApprovals).toBeDefined();
    expect(Array.isArray(result.expiredApprovals)).toBe(true);
    expect(result.expiredApprovals.length).toBe(0);

    expect(result.totalCount).toBe(0);
  });
});
