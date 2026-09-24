import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  DuplicateEmailAddressDetected,
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

describe('SCEN-351: 同じメールアドレスが既に登録されている場合、br-tx_7-003の制約4により「このメールアドレスは既に登録されています」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('メールアドレスが既に登録されている場合、DuplicateEmailAddressDetectedエラーが返される', () => {
    // スタブ化の設定
    (validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (validateEmailAddress as jest.Mock).mockReturnValue(true);
    // detectDuplicateEmailAddressが重複を検出
    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue(true);
    (validateReporterNameFormat as jest.Mock).mockReturnValue(true);

    const input: RegisterReporterInput = {
      userId: 'NEW-001',
      reporterName: '山田太郎',
      emailAddress: 'test-reporter@company.jp',
      teamLeaderId: 'TL-001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = registerReporter(input);

    // 期待結果の検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster と persistReporterMasterChangeHistory は呼び出されない
    expect(registerReporterToMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
