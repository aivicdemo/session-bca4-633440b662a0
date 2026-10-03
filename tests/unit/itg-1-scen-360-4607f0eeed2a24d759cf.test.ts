import { registerReporter } from '../../src/logic/reporter-master-management';
import type { RegisterReporterInput } from '../../src/logic/reporter-master-management';
import * as validation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn().mockResolvedValue({ valid: true }),
  validateEmailAddress: jest.fn().mockResolvedValue({ valid: true }),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue({ hasDuplicate: false }),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue({ isActive: true }),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  registerReporterToMaster: jest.fn().mockResolvedValue({ reporterId: 'reporter_new_001' }),
  persistReporterMasterChangeHistory: jest.fn().mockResolvedValue({ changeHistoryId: 'history_001' }),
}));

describe('SCEN-360: 有効状態が無効に変更された報告者の場合、br-tx_7-005により日報入力対象から自動的に除外される', () => {
  const now = new Date('2026-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('isActive=falseの報告者は登録処理が成功し、日報対象から除外される', async () => {
    const input: RegisterReporterInput = {
      userId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    const result = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBeDefined();
    expect(result.changeHistoryId).toBeDefined();
    expect(result.message).toBeDefined();
  });
});
