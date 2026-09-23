import { jest } from '@jest/globals';
import { registerReporter, DuplicateEmailAddressDetected } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

import * as validationModule from '../../src/logic/input-validation-formatting';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as persistenceModule from '../../src/logic/user-master-persistence';

describe('SCEN-351: 重複メールアドレス検出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('同じメールアドレスが既に登録されている場合、エラーメッセージが返される', async () => {
    // スタブ設定
    (validationModule.validateReporterNameFormat as any).mockReturnValue(true);
    (validationModule.validateEmailAddress as any).mockReturnValue(true);
    (validationModule.detectDuplicateEmailAddress as any).mockReturnValue(true);
    (authModule.validateUserAccountActiveStatus as any).mockReturnValue(true);

    const input = {
      userId: 'NEW-001',
      reporterName: '山田太郎',
      emailAddress: 'test-reporter@company.jp',
      teamLeaderId: 'TL-001',
      executionTimestamp: new Date().toISOString(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster と persistReporterMasterChangeHistory は呼ばれないことを確認
    expect(persistenceModule.registerReporterToMaster).not.toHaveBeenCalled();
    expect(persistenceModule.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
