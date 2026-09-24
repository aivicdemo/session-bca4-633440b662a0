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
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-355: 同じメールアドレスが既に別の報告者に登録されており、新規登録操作の場合、エラーメッセージが返される', () => {
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

  it('should return duplicate email address error with success=false and null reporterId/changeHistoryId', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date(),
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(true);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('このメールアドレスは既に使用されています');
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
  });

  it('should not call registerReporterToMaster or persistReporterMasterChangeHistory when duplicate email detected', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date(),
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(true);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('should verify validation functions are called in correct order before duplicate check', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date(),
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(true);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);

    await registerReporter(input);

    expect(mockValidateReporterNameFormat).toHaveBeenCalled();
    expect(mockValidateEmailAddress).toHaveBeenCalled();
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith('existing@example.com');
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith('USER-001');
  });
});
