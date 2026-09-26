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

describe('SCEN-355: メールアドレス重複エラー', () => {
  const mockValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
  const mockValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
  const mockDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
  const mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
  const mockRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
  const mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('同じメールアドレスが既に別の報告者に登録されており、新規登録操作の場合、br-tx_7-004の制約3により「このメールアドレスは既に使用されています」エラーメッセージが返される', async () => {
    const executionTimestamp = new Date('2026-09-25T10:00:00Z');
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp,
    };

    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: null,
    });

    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: true,
      validatedEmailAddress: 'existing@example.com',
      errorCode: 'DUPLICATE_EMAIL',
    });

    mockValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
      userId: 'USER-001',
      inactiveReason: null,
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に使用されています');
    expect(result.changeHistoryId).toBeNull();

    expect(mockRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
