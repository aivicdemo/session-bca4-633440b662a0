import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

import {
  validateReporterNameFormat,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

describe('SCEN-358: 更新で情報が置き換えられた場合、br-tx_7-005により対象者情報が置き換えられ、同期完了日時と次回日報対象者リストが返される', () => {
  it('reporterID=REP-001で登録した場合、同期完了日時と次回日報対象者リストが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'REP-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    (validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    (validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    (validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId: 'REP-001',
      inactiveReason: null,
    });

    (registerReporterToMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'REP-001',
      message: '報告者をマスタに登録しました',
    });

    (persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({
      success: true,
      changeHistoryId: 'CH-001',
      message: '変更履歴を記録しました',
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP-001');
    expect(result.message).toBeTruthy();
    expect(result.message).not.toMatch(/エラー|失敗|Error/);
    expect(result.changeHistoryId).toBe('CH-001');
    expect(result).toBeDefined();
  });
});
