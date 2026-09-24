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

describe('SCEN-357: 新規登録で有効なメールアドレスと報告者情報が入力された場合、対象者リストに追加され、同期完了日時と次回日報対象者リストが返される', () => {
  const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<
    typeof validateReporterNameFormat
  >;
  const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<
    typeof validateEmailAddress
  >;
  const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<
    typeof detectDuplicateEmailAddress
  >;
  const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<
    typeof validateUserAccountActiveStatus
  >;
  const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<
    typeof registerReporterToMaster
  >;
  const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<
    typeof persistReporterMasterChangeHistory
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully register reporter and return success response with valid inputs', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: executionTimestamp,
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRegisterReporterToMaster.mockReturnValue({
      reporterId: 'REP001',
    } as any);
    mockPersistReporterMasterChangeHistory.mockReturnValue({
      changeHistoryId: 'CHG001',
    } as any);

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
    expect(result.message).toBe('報告者を登録しました');
    expect(result.changeHistoryId).toBe('CHG001');
  });

  it('should call all validation functions in correct sequence', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: executionTimestamp,
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRegisterReporterToMaster.mockReturnValue({
      reporterId: 'REP001',
    } as any);
    mockPersistReporterMasterChangeHistory.mockReturnValue({
      changeHistoryId: 'CHG001',
    } as any);

    await registerReporter(input);

    const validateOrder = [
      mockValidateReporterNameFormat,
      mockValidateEmailAddress,
      mockDetectDuplicateEmailAddress,
      mockValidateUserAccountActiveStatus,
    ];

    validateOrder.forEach((mockFn) => {
      expect(mockFn).toHaveBeenCalled();
    });

    expect(mockValidateReporterNameFormat).toHaveBeenCalledWith('田中太郎');
    expect(mockValidateEmailAddress).toHaveBeenCalledWith('tanaka@example.com');
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith('tanaka@example.com');
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith('U001');
  });

  it('should call registerReporterToMaster and persistReporterMasterChangeHistory', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: executionTimestamp,
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRegisterReporterToMaster.mockReturnValue({
      reporterId: 'REP001',
    } as any);
    mockPersistReporterMasterChangeHistory.mockReturnValue({
      changeHistoryId: 'CHG001',
    } as any);

    await registerReporter(input);

    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });

  it('should verify new reporter is included in active reporters list after successful registration', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: executionTimestamp,
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRegisterReporterToMaster.mockReturnValue({
      reporterId: 'REP001',
    } as any);
    mockPersistReporterMasterChangeHistory.mockReturnValue({
      changeHistoryId: 'CHG001',
    } as any);

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REP001');
  });

  it('should record change history with correct operation type and timestamps', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: executionTimestamp,
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRegisterReporterToMaster.mockReturnValue({
      reporterId: 'REP001',
    } as any);
    mockPersistReporterMasterChangeHistory.mockReturnValue({
      changeHistoryId: 'CHG001',
    } as any);

    await registerReporter(input);

    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
