import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
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

jest.mock('../../src/logic/user-authentication-authorization.ts', () => ({
  validateUserAccountActiveStatus: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence.ts', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-340: 新入社員配属で既存報告者IDがない場合、br-tx_7-002により登録操作が決定される', () => {
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
    mockValidateUserAccountActiveStatus = require('../../src/logic/user-authentication-authorization.ts')
      .validateUserAccountActiveStatus as jest.Mock;
    mockRegisterReporterToMaster = require('../../src/logic/user-master-persistence.ts')
      .registerReporterToMaster as jest.Mock;
    mockPersistReporterMasterChangeHistory = require('../../src/logic/user-master-persistence.ts')
      .persistReporterMasterChangeHistory as jest.Mock;

    // スタブ設定：検証は全て成功
    // @ts-ignore
    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({ isValid: true });
    // @ts-ignore
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true });

    // マスタ登録スタブ
    // @ts-ignore
    mockRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REPORTER-001' });

    // 変更履歴記録スタブ
    // @ts-ignore
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'HISTORY-001',
    });
  });

  it('新入社員配属で既存reporterIdがない場合に登録操作が決定され、正常に登録が完了する', async () => {
    const executionTimestamp = new Date();
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada.taro@company.example.com',
      teamLeaderId: 'TL-001',
      executionTimestamp,
    };

    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER-001');
    expect(result.message).toBe('報告者を正常に登録しました。');
    expect(result.changeHistoryId).toBe('HISTORY-001');

    // 各検証関数が呼び出されたことを確認
    expect(mockValidateReporterNameFormat).toHaveBeenCalledWith(
      expect.objectContaining({ reporterName: '山田太郎' })
    );
    expect(mockValidateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'yamada.taro@company.example.com' })
    );
    expect(mockDetectDuplicateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'yamada.taro@company.example.com' })
    );
    expect(mockValidateUserAccountActiveStatus).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'USER-001' })
    );

    // registerReporterToMasterが呼び出されたことを確認
    expect(mockRegisterReporterToMaster).toHaveBeenCalled();

    // persistReporterMasterChangeHistoryが呼び出されたことを確認
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'CREATE',
        reporterId: 'REPORTER-001',
        executedBy: 'TL-001',
        executedAt: executionTimestamp,
      })
    );
  });
});
