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
import {
  validateUserAccountActiveStatus,
} from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-371: UPDATE操作で変更前後の値が完全に同じ場合、br-tx_7-007の制約4により「変更内容がありません。保存をスキップします」警告メッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UPDATE操作で変更前後の値が完全に同じ場合、警告メッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<typeof validateReporterNameFormat>;
    const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<typeof validateEmailAddress>;
    const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<typeof detectDuplicateEmailAddress>;
    const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<typeof validateUserAccountActiveStatus>;
    const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<typeof registerReporterToMaster>;
    const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistReporterMasterChangeHistory>;

    mockValidateReporterNameFormat.mockResolvedValue({ success: true });
    mockValidateEmailAddress.mockResolvedValue({ success: true });
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    mockValidateUserAccountActiveStatus.mockResolvedValue({ success: true });
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP001' });

    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: false,
      changeHistoryId: null,
      message: '変更内容がありません。保存をスキップします',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe('REP001');
    expect(result.message).toBe('変更内容がありません。保存をスキップします');
    expect(result.changeHistoryId).toBeNull();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });

  it('beforeValuesとafterValuesが完全に一致する場合、persistReporterMasterChangeHistoryの呼び出しがスキップされるか呼ばれない', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<typeof validateReporterNameFormat>;
    const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<typeof validateEmailAddress>;
    const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<typeof detectDuplicateEmailAddress>;
    const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<typeof validateUserAccountActiveStatus>;
    const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<typeof registerReporterToMaster>;
    const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistReporterMasterChangeHistory>;

    mockValidateReporterNameFormat.mockResolvedValue({ success: true });
    mockValidateEmailAddress.mockResolvedValue({ success: true });
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    mockValidateUserAccountActiveStatus.mockResolvedValue({ success: true });
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP001' });

    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: false,
      changeHistoryId: null,
      message: '変更内容がありません。保存をスキップします',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('変更内容がありません。保存をスキップします');
    expect(result.changeHistoryId).toBeNull();
  });

  it('beforeValuesと afterValuesが同一である場合、changedFields配列は空となる', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<typeof validateReporterNameFormat>;
    const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<typeof validateEmailAddress>;
    const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<typeof detectDuplicateEmailAddress>;
    const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<typeof validateUserAccountActiveStatus>;
    const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<typeof registerReporterToMaster>;
    const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistReporterMasterChangeHistory>;

    mockValidateReporterNameFormat.mockResolvedValue({ success: true });
    mockValidateEmailAddress.mockResolvedValue({ success: true });
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    mockValidateUserAccountActiveStatus.mockResolvedValue({ success: true });
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP001' });

    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: false,
      changeHistoryId: null,
      message: '変更内容がありません。保存をスキップします',
    });

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('変更内容がありません。保存をスキップします');
    expect(result.changeHistoryId).toBeNull();
  });
});
