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

describe('SCEN-356: 報告者ID重複エラー', () => {
  const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
  const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
  const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
  const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
  const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
  const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;
  const mockRetrieveReporterByUserId = retrieveReporterByUserId as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('同じ報告者IDが既に別のメールアドレスで登録されており、新規登録操作の場合、br-tx_7-004の制約4により「この報告者IDは既に登録されています」エラーメッセージが返される', async () => {
    const executionTimestamp = new Date('2026-09-25T10:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'USER-NEW001',
      reporterName: '重複ID報告者',
      emailAddress: 'duplicate-id@example.com',
      teamLeaderId: 'USER-TL001',
      executionTimestamp,
    };

    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '重複ID報告者',
      errorCode: null,
    });

    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'duplicate-id@example.com',
      errorCode: null,
    });

    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'duplicate-id@example.com',
      errorCode: null,
    });

    mockValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'USER-TL001',
      inactiveReason: null,
    });

    mockRetrieveReporterByUserId.mockResolvedValue({
      success: true,
      reporter: {
        reporterId: 'USER-NEW001',
        userId: 'USER-NEW001',
        reporterName: '既存報告者',
        emailAddress: 'old-email@example.com',
        department: '営業部',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      message: undefined,
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('この報告者IDは既に登録されています');
    expect(result.changeHistoryId).toBeNull();

    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
