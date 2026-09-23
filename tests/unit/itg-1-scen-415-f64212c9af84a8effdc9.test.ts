import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveUserInformationConfirmationStatus,
  buildUserInformationConfirmationStatusList,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

jest.mock('../../src/logic/user-information-input-confirmation.ts');

describe('SCEN-415: チームリーダーが有効な権限を持つ場合、未承認・承認済み・承認期限超過のユーザー情報を正常に取得できる', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockBuildUserInformationConfirmationStatusList: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts').authenticateAndAuthorizeLeaderAccess;
    mockBuildUserInformationConfirmationStatusList = require('../../src/logic/user-information-input-confirmation.ts').buildUserInformationConfirmationStatusList;

    // リーダー権限チェックを成功させる
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ authorized: true });

    // モックデータの構築
    const pendingApprovalsData = [
      {
        userInformationId: 'user-a',
        reporterName: 'ユーザーA',
        email: 'user-a@example.com',
        status: 'pending',
      },
      {
        userInformationId: 'user-b',
        reporterName: 'ユーザーB',
        email: 'user-b@example.com',
        status: 'pending',
      },
    ];

    const approvedRecordsData = [
      {
        userInformationId: 'user-c',
        reporterName: 'ユーザーC',
        email: 'user-c@example.com',
        status: 'approved',
      },
      {
        userInformationId: 'user-d',
        reporterName: 'ユーザーD',
        email: 'user-d@example.com',
        status: 'approved',
      },
      {
        userInformationId: 'user-e',
        reporterName: 'ユーザーE',
        email: 'user-e@example.com',
        status: 'approved',
      },
    ];

    const expiredApprovalsData = [
      {
        userInformationId: 'user-f',
        reporterName: 'ユーザーF',
        email: 'user-f@example.com',
        status: 'expired',
      },
    ];

    // @ts-ignore
    mockBuildUserInformationConfirmationStatusList.mockResolvedValue({
      pendingApprovals: pendingApprovalsData,
      approvedRecords: approvedRecordsData,
      expiredApprovals: expiredApprovalsData,
      totalCount: 6,
    });
  });

  it('チームリーダーが有効な権限を持つ場合、未承認・承認済み・承認期限超過のユーザー情報を正常に取得できる', async () => {
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
    expect(result.pendingApprovals.length).toBe(2);

    expect(result.approvedRecords).toBeDefined();
    expect(Array.isArray(result.approvedRecords)).toBe(true);
    expect(result.approvedRecords.length).toBe(3);

    expect(result.expiredApprovals).toBeDefined();
    expect(Array.isArray(result.expiredApprovals)).toBe(true);
    expect(result.expiredApprovals.length).toBe(1);

    expect(result.totalCount).toBe(6);
  });
});
