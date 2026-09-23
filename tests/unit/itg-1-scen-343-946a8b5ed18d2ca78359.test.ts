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

describe('SCEN-343: 休職のメンバーの場合、br-tx_7-002により更新操作が決定される', () => {
  const now = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('memberChangeType=休職のとき action=更新が決定され、既存報告者のマスタ登録情報がステータス 休職中 に更新される', async () => {
    const mockValidateReporterNameFormat = jest.fn().mockResolvedValue(true);
    const mockValidateEmailAddress = jest.fn().mockResolvedValue(true);
    const mockDetectDuplicateEmailAddress = jest.fn().mockResolvedValue(false);
    const mockValidateUserAccountActiveStatus = jest.fn().mockResolvedValue({
      isActive: true,
      status: '休職中',
    } as ValidateUserAccountActiveStatusOutput);

    const mockRegisterReporterToMaster = jest.fn().mockResolvedValue({
      reporterId: 'reporter-001',
      status: '休職中',
      success: true,
    });

    const mockPersistReporterMasterChangeHistory = jest.fn().mockResolvedValue({
      changeHistoryId: 'history-20250115-001',
      success: true,
    });

    const input: RegisterReporterInput = {
      userId: 'user-on-leave-001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: now,
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toBe('休職中のメンバーの報告者ステータスを更新しました。');
    expect(result.changeHistoryId).toBe('history-20250115-001');

    expect(mockRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();

    const persistCall = mockPersistReporterMasterChangeHistory.mock.calls[0]?.[0];
    expect(persistCall?.operationType).toBe('UPDATE');
    expect(persistCall?.beforeValues).toEqual({
      status: '在籍',
    });
    expect(persistCall?.afterValues).toEqual({
      status: '休職中',
    });
    expect(persistCall?.executedBy).toBe('leader-001');
    expect(persistCall?.executedAt).toEqual(now);
  });
});
