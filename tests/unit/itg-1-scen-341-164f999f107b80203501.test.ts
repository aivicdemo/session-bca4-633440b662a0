import { describe, it, expect, beforeEach } from '@jest/globals';
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
  ValidateUserAccountActiveStatusOutput,
} from '../../src/logic/user-authentication-authorization';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

describe('SCEN-341: 異動で既存報告者IDが存在する場合、br-tx_7-002により更新操作が決定される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('既存報告者IDが存在する異動ケースでは、registerReporterToMasterとpersistReporterMasterChangeHistoryが UPDATE オペレーションタイプで呼び出される', async () => {
    const mockValidateReporterNameFormat = jest
      .fn()
      .mockResolvedValue(true);
    const mockValidateEmailAddress = jest.fn().mockResolvedValue(true);
    const mockDetectDuplicateEmailAddress = jest.fn().mockResolvedValue(false);
    const mockValidateUserAccountActiveStatus = jest.fn().mockResolvedValue({
      isActive: true,
      status: '在籍',
    } as ValidateUserAccountActiveStatusOutput);

    const mockRegisterReporterToMaster = jest.fn().mockResolvedValue({
      reporterId: 'R001',
      success: true,
    });

    const mockPersistReporterMasterChangeHistory = jest.fn().mockResolvedValue({
      changeHistoryId: 'CHG-001',
      success: true,
    });

    const input: RegisterReporterInput = {
      userId: 'R001',
      reporterName: '異動後太郎',
      emailAddress: 'moved@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toBe('報告者情報を更新しました。');
    expect(result.changeHistoryId).toBe('CHG-001');

    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();

    const persistCall = mockPersistReporterMasterChangeHistory.mock.calls[0]?.[0];
    expect(persistCall?.operationType).toBe('UPDATE');
    expect(persistCall?.reporterId).toBe('R001');
    expect(persistCall?.beforeValues).toEqual({
      name: '既存太郎',
      email: 'existing@example.com',
    });
    expect(persistCall?.afterValues).toEqual({
      name: '異動後太郎',
      email: 'moved@example.com',
    });
    expect(persistCall?.executedBy).toBe('TL001');
    expect(persistCall?.executedAt).toEqual(now);
  });
});
