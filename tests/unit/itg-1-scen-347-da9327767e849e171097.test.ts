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

describe('SCEN-347: 報告者名が入力され、メールアドレスが入力され、メールアドレス形式が正しく、重複がない場合、br-tx_7-003により有効判定で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('報告者名、メールアドレスが入力され、形式が正しく、重複がない場合、RegisterReporterOutput が成功で返される', () => {
    // スタブ化の設定
    (validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (validateEmailAddress as jest.Mock).mockReturnValue(true);
    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue(false);
    (registerReporterToMaster as jest.Mock).mockResolvedValue({
      reporterId: 'REPORTER001',
    });
    (persistReporterMasterChangeHistory as jest.Mock).mockResolvedValue({
      changeHistoryId: 'HISTORY001',
    });

    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result: RegisterReporterOutput = registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER001');
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
    expect(result.changeHistoryId).toBe('HISTORY001');

    // 依存先の呼び出しを検証
    expect(validateReporterNameFormat).toHaveBeenCalledWith('山田太郎');
    expect(validateEmailAddress).toHaveBeenCalledWith('yamada@example.com');
    expect(detectDuplicateEmailAddress).toHaveBeenCalledWith('yamada@example.com');
    expect(registerReporterToMaster).toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'CREATE',
        reporterId: 'REPORTER001',
        executedBy: 'LEADER001',
      })
    );
  });
});
