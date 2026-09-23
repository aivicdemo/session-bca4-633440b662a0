import { jest } from '@jest/globals';
import { registerReporter, InvalidEmailAddressFormat } from '../../src/logic/reporter-master-management';

// スタブの設定と検証用のモック
jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

import * as validationModule from '../../src/logic/input-validation-formatting';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as persistenceModule from '../../src/logic/user-master-persistence';

describe('SCEN-350: メールアドレス形式エラー検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールアドレスが@を含まない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    // スタブ設定：validateEmailAddress が InvalidEmailAddressFormat エラーをスロー
    (validationModule.validateEmailAddress as any).mockImplementation(() => {
      const err = new Error('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
      (err as any).name = 'InvalidEmailAddressFormat';
      throw err;
    });

    const input = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'test', // @を含まない不正な形式
      teamLeaderId: 'TL001',
      executionTimestamp: new Date().toISOString(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
