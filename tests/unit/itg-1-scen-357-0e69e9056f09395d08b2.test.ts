import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-357: 新規登録成功ケース', () => {
  const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
  const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
  const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
  const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
  const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
  const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規登録で有効なメールアドレスと報告者情報が入力された場合、br-tx_7-005により対象者リストに追加され、同期完了日時と次回日報対象者リストが返される', async () => {
    const executionTimestamp = new Date('2026-09-25T10:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '田中太郎',
      errorCode: null,
    });

    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    mockValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'U001',
      inactiveReason: null,
    });

    mockRegisterReporterToMaster.mockResolvedValue({
      success: true,
      reporterId: 'REP001',
      message: '報告者をマスタに登録しました',
    });

    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'CHG001',
      message: '変更履歴を記録しました',
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
    expect(result.message).toBe('報告者を登録しました');
    expect(result.changeHistoryId).toBe('CHG001');

    expect(mockValidateReporterNameFormat).toHaveBeenCalled();
    expect(mockValidateEmailAddress).toHaveBeenCalled();
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalled();
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalled();
    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
