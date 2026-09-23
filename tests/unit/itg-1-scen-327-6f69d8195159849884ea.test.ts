import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import type {
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting.ts', () => ({
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  validateUserAccountActiveStatus: jest.fn(),
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-327: 有効なユーザーID・報告者名・メールアドレスで新規報告者を登録し、成功レスポンスと変更履歴IDを返す', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockDetectDuplicateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;
  let mockRegisterReporterToMaster: jest.Mock;
  let mockPersistReporterMasterChangeHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = require('../../src/logic/input-validation-formatting.ts')
      .validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .validateEmailAddress as jest.Mock;
    mockDetectDuplicateEmailAddress = require('../../src/logic/input-validation-formatting.ts')
      .detectDuplicateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = require('../../src/logic/user-master-persistence.ts')
      .validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts')
      .registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts')
      .persistReporterMasterChangeHistory as jest.Mock;

    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'RPT-001' });
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CHG-001',
    });
  });

  it('有効なユーザーID・報告者名・メールアドレスで新規報告者を登録し、成功レスポンスと変更履歴IDを返す', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toBe('報告者を正常に登録しました');
    expect(result.changeHistoryId).toBe('CHG-001');

    expect(mockValidateReporterNameFormat).toHaveBeenCalledWith(
      expect.objectContaining({ reporterName: '山田太郎' })
    );
    expect(mockValidateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'yamada@example.com' })
    );
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'yamada@example.com' })
    );
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'U001' })
    );
    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'CREATE',
        reporterId: 'RPT-001',
        executedBy: 'TL001',
        executedAt: executionTimestamp,
      })
    );

    const callOrder = [
      mockValidateReporterNameFormat.mock.invocationCallOrder[0],
      mockValidateEmailAddress.mock.invocationCallOrder[0],
      mockDetectDuplicateEmailAddress.mock.invocationCallOrder[0],
      mockValidateUserAccountActiveStatus.mock.invocationCallOrder[0],
      mockRegisterReporterToMaster.mock.invocationCallOrder[0],
      mockPersistReporterMasterChangeHistory.mock.invocationCallOrder[0],
    ];
    expect(callOrder).toEqual(callOrder.sort((a, b) => a - b));
  });
});
