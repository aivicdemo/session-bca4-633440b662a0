import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-352: 新規登録操作で、メールアドレスが未登録で、報告者名が存在し、メールアドレス形式が正しい場合、br-tx_7-004により保存可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('新規登録時に検証に合格した場合、br-tx_7-004により保存可能と判定される', () => {
    // スタブ化の設定
    (validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (validateEmailAddress as jest.Mock).mockReturnValue(true);
    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue(false);
    (registerReporterToMaster as jest.Mock).mockResolvedValue({
      reporterId: 'REP001',
    });
    (persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({
      changeHistoryId: 'HIST001',
    });

    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
    expect(result.reporterId).not.toBeNull();
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
    expect(result.message).not.toBe('');
    expect(result.changeHistoryId).toBe('HIST001');
    expect(result.changeHistoryId).not.toBeNull();

    // persistReporterMasterChangeHistory が正しく呼ばれていることを検証
    expect(persistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'CREATE',
        reporterId: 'REP001',
        changedFields: expect.any(Array),
        executedBy: 'LEADER001',
      })
    );
  });
});
