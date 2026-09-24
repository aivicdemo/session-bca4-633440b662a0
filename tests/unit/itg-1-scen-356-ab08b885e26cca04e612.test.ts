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
  retrieveReporterByUserId,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-356: 同じ報告者IDが既に別のメールアドレスで登録されており、新規登録操作の場合、エラーメッセージが返される', () => {
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
  const mockRetrieveReporterByUserId = retrieveReporterByUserId as jest.MockedFunction<
    typeof retrieveReporterByUserId
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return duplicate reporter ID error when user ID already exists with different email', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-NEW001',
      reporterName: '重複ID報告者',
      emailAddress: 'duplicate-id@example.com',
      teamLeaderId: 'USER-TL001',
      executionTimestamp: new Date(),
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRetrieveReporterByUserId.mockReturnValue({
      userId: 'USER-NEW001',
      email: 'old-email@example.com',
    } as any);

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('この報告者IDは既に登録されています');
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
  });

  it('should not call registerReporterToMaster when duplicate reporter ID detected', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-NEW001',
      reporterName: '重複ID報告者',
      emailAddress: 'duplicate-id@example.com',
      teamLeaderId: 'USER-TL001',
      executionTimestamp: new Date(),
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRetrieveReporterByUserId.mockReturnValue({
      userId: 'USER-NEW001',
      email: 'old-email@example.com',
    } as any);

    await registerReporter(input);

    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('should verify email duplicate check does not conflict with reporter ID check', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER-NEW001',
      reporterName: '重複ID報告者',
      emailAddress: 'duplicate-id@example.com',
      teamLeaderId: 'USER-TL001',
      executionTimestamp: new Date(),
    };

    mockValidateReporterNameFormat.mockReturnValue(true);
    mockValidateEmailAddress.mockReturnValue(true);
    mockDetectDuplicateEmailAddress.mockReturnValue(false);
    mockValidateUserAccountActiveStatus.mockReturnValue(true);
    mockRetrieveReporterByUserId.mockReturnValue({
      userId: 'USER-NEW001',
      email: 'old-email@example.com',
    } as any);

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith('duplicate-id@example.com');
    expect(result.success).toBe(false);
    expect(result.message).toBe('この報告者IDは既に登録されています');
  });
});
