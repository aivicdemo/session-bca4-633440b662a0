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

describe('SCEN-370: 実行者のユーザーIDが空の場合、br-tx_7-007の制約3により「実行者情報が取得できません」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('teamLeaderIdが空文字列の場合、実行者情報が取得できませんエラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: '', // 空文字列
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

    mockPersistReporterMasterChangeHistory.mockRejectedValueOnce(
      new Error('実行者情報が取得できません')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
  });

  it('teamLeaderIdがnullに設定された場合、実行者情報が取得できませんエラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: null as any,
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

    mockPersistReporterMasterChangeHistory.mockRejectedValueOnce(
      new Error('実行者情報が取得できません')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
  });

  it('teamLeaderIdが空白のみの場合、実行者情報が取得できませんエラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: '   ', // 空白のみ
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

    mockPersistReporterMasterChangeHistory.mockRejectedValueOnce(
      new Error('実行者情報が取得できません')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('実行者情報が取得できません');
    expect(result.changeHistoryId).toBeNull();
  });
});
