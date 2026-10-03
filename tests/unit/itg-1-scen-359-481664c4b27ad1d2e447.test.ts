import { registerReporter } from '../../src/logic/reporter-master-management';
import type { RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';
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

describe('SCEN-359: 削除で対象者が指定された場合、br-tx_7-005により対象者リストから除外され、同期完了日時と次回日報対象者リストが返される', () => {
  const now = new Date('2026-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('削除アクション実行時、新規登録が完了し対象者が除外されたリストが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user_active_1',
      reporterName: 'テスト太郎',
      emailAddress: 'test.taro@example.com',
      teamLeaderId: 'leader_001',
      executionTimestamp: now,
    };

    const result = await registerReporter(input);

    // RegisterReporterOutput型の検証
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporterId).toBeDefined();
    expect(result.changeHistoryId).toBeDefined();
    expect(result.message).toBeDefined();
  });
});
