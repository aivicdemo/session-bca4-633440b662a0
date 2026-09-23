import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveUserInformationConfirmationStatus,
  DataRetrievalError,
  buildUserInformationConfirmationStatusList,
} from '../../src/logic/user-information-input-confirmation';

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

jest.mock('../../src/logic/user-information-input-confirmation.ts');

describe('SCEN-417: ユーザー情報確認状態の取得処理がシステム障害で失敗した場合、DataRetrievalErrorが発生する', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: jest.Mock;
  let mockBuildUserInformationConfirmationStatusList: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateAndAuthorizeLeaderAccess = require('../../src/logic/user-authentication-authorization.ts').authenticateAndAuthorizeLeaderAccess;
    mockBuildUserInformationConfirmationStatusList = require('../../src/logic/user-information-input-confirmation.ts').buildUserInformationConfirmationStatusList;

    // リーダー権限チェックを成功させる
    // @ts-ignore
    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ authorized: true });

    // buildUserInformationConfirmationStatusList がシステム障害でエラーを発生させる
  });

  it('ユーザー情報確認状態の取得処理がシステム障害で失敗した場合、DataRetrievalErrorが発生する', async () => {
    const input = {
      leaderUserId: 'leader-001',
      retrievalTimestamp: new Date(),
    };

    // @ts-ignore
    mockBuildUserInformationConfirmationStatusList.mockImplementation(() => {
      throw new DataRetrievalError('ユーザー情報確認状態の取得に失敗しました。');
    });

    // @ts-ignore
    await expect(retrieveUserInformationConfirmationStatus(input)).rejects.toThrow(DataRetrievalError);

    // エラーメッセージを確認
    try {
      // @ts-ignore
      await retrieveUserInformationConfirmationStatus(input);
    } catch (error: any) {
      expect(error.message).toBe('ユーザー情報確認状態の取得に失敗しました。');
    }
  });
});
