import { jest } from '@jest/globals';
import { registerReporter } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

import * as validationModule from '../../src/logic/input-validation-formatting';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as persistenceModule from '../../src/logic/user-master-persistence';

describe('SCEN-352: 新規登録正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールアドレス未登録で、報告者名が有効、形式が正しい場合、報告者が登録される', async () => {
    // スタブ設定
    (validationModule.validateReporterNameFormat as any).mockReturnValue(true);
    (validationModule.validateEmailAddress as any).mockReturnValue(true);
    (validationModule.detectDuplicateEmailAddress as any).mockReturnValue(false);
    (authModule.validateUserAccountActiveStatus as any).mockReturnValue(true);
    (persistenceModule.registerReporterToMaster as any).mockResolvedValue({ reporterId: 'REP001' });
    (persistenceModule.persistReporterMasterChangeHistory as any).mockResolvedValue({ changeHistoryId: 'HIST001' });

    const input = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date().toISOString(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
    expect(result.message).toBeTruthy();
    expect(result.message).not.toBe('');
    expect(result.changeHistoryId).toBe('HIST001');

    // 依存先の関数が呼び出されたことを確認
    expect(validationModule.validateReporterNameFormat).toHaveBeenCalledWith('山田太郎');
    expect(validationModule.validateEmailAddress).toHaveBeenCalledWith('yamada@example.com');
    expect(validationModule.detectDuplicateEmailAddress).toHaveBeenCalledWith('yamada@example.com');
    expect(authModule.validateUserAccountActiveStatus).toHaveBeenCalledWith('USER001');
    expect(authModule.validateUserAccountActiveStatus).toHaveBeenCalledWith('LEADER001');
    expect(persistenceModule.registerReporterToMaster).toHaveBeenCalled();
    expect(persistenceModule.persistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
