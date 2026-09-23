import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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
  validateUserAccountActiveStatus,
} from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

// 依存先のモック
jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-355: 同じメールアドレスが既に別の報告者に登録されており、新規登録操作の場合、br-tx_7-004の制約3により「このメールアドレスは既に使用されています」エラーメッセージが返される', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

    // validateReporterNameFormat は成功するように設定
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
    });

    // validateEmailAddress はメールアドレスの形式が有効と判定
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
    });

    // validateUserAccountActiveStatus はユーザーがアクティブと判定
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
    });

    // detectDuplicateEmailAddress は重複を検出してエラーを発生させるように設定
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockImplementation(async () => {
      throw new DuplicateEmailAddressDetected('このメールアドレスは既に使用されています');
    });

    // registerReporterToMaster と persistReporterMasterChangeHistory は呼び出されないはず
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({
      reporterId: null,
    });
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: null,
    });
  });

  it('メールアドレスが既に登録されている場合、success=false、reporterId=null、message=\"このメールアドレスは既に使用されています\"が返され、登録処理は中止される', async () => {
    // 入力値を構築
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'existing@example.com', // 既に登録されているメールアドレス
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toBe('このメールアドレスは既に使用されています');
    expect(result.changeHistoryId).toBe(null);

    // registerReporterToMaster と persistReporterMasterChangeHistory が呼び出されていないことを確認
    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
