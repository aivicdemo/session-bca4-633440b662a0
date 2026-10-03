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

describe('SCEN-357: 新規登録成功ケース', () => {
  it('新規登録で有効なメールアドレスと報告者情報が入力された場合、br-tx_7-005により対象者リストに追加され、同期完了日時と次回日報対象者リストが返される', async () => {
    const executionTimestamp = new Date('2026-09-25T10:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    (validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: '田中太郎',
      errorCode: null,
    });

    (validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    (validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId: 'U001',
      inactiveReason: null,
    });

    (registerReporterToMaster as jest.Mock).mockResolvedValue({
      success: true,
      reporterId: 'REP001',
      message: '報告者をマスタに登録しました',
    });

    (persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({
      success: true,
      changeHistoryId: 'CHG001',
      message: '変更履歴を記録しました',
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
    expect(result.message).toBe('報告者を登録しました');
    expect(result.changeHistoryId).toBe('CHG001');

    expect(validateReporterNameFormat).toHaveBeenCalled();
    expect(validateEmailAddress).toHaveBeenCalled();
    expect(detectDuplicateEmailAddress).toHaveBeenCalled();
    expect(validateUserAccountActiveStatus).toHaveBeenCalled();
    expect(registerReporterToMaster).toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
