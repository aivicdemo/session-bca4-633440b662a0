import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidOperationType,
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

describe('SCEN-369: 操作種別がCREATE・UPDATE・DELETE以外の場合、br-tx_7-007の制約2により「不正な操作種別です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('operationTypeが「INVALID」の場合、不正な操作種別エラーが返される', async () => {
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

    mockPersistReporterMasterChangeHistory.mockRejectedValueOnce(
      new InvalidOperationType('不正な操作種別です')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });

  it('operationTypeが「UNKNOWN」の場合、不正な操作種別エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL002',
      reporterName: '鈴木次郎',
      emailAddress: 'suzuki@example.com',
      teamLeaderId: 'TL002',
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
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP002' });

    mockPersistReporterMasterChangeHistory.mockRejectedValueOnce(
      new InvalidOperationType('不正な操作種別です')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });

  it('operationTypeが空文字列の場合、不正な操作種別エラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL003',
      reporterName: '田中三郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL003',
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
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REP003' });

    mockPersistReporterMasterChangeHistory.mockRejectedValueOnce(
      new InvalidOperationType('不正な操作種別です')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('不正な操作種別です');
    expect(result.changeHistoryId).toBeNull();
  });
});
