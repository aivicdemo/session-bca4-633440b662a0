import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  recordReporterMasterChangeHistory,
  RecordReporterMasterChangeHistoryInput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/reporter-master-persistence');

describe('SCEN-371: UPDATE操作で変更前後の値が完全に同じ場合、警告メッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UPDATE操作で変更前後の値が完全に同じ場合、警告メッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'TL001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const {
      validateReporterNameFormat,
      validateEmailAddress,
      detectDuplicateEmailAddress,
      validateUserAccountActiveStatus,
    } = require('../../src/logic/input-validation-formatting');

    const { registerReporterToMaster } = require('../../src/logic/reporter-master-persistence');

    validateReporterNameFormat.mockResolvedValue({ isValid: true });
    validateEmailAddress.mockResolvedValue({ isValid: true });
    detectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false });
    validateUserAccountActiveStatus.mockResolvedValue({ isActive: true });
    registerReporterToMaster.mockResolvedValue({ reporterId: 'REP001' });

    // recordMasterChangeLog業務ルール（br-tx_7-007）のシミュレーション：
    // UPDATE操作でbeforeValuesとafterValuesが完全に同じ場合、警告を返す
    const historyInput: RecordReporterMasterChangeHistoryInput = {
      operationType: 'update',
      reporterId: 'REP001',
      beforeValues: { reporterName: '山田太郎', emailAddress: 'yamada@example.com' },
      afterValues: { reporterName: '山田太郎', emailAddress: 'yamada@example.com' },
      executorId: 'TL001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    // recordReporterMasterChangeHistoryがUPDATE操作で同じ値を検出し警告を返す
    const result = await recordReporterMasterChangeHistory(historyInput);

    expect(result.success).toBe(false);
    expect(result.message).toBe('変更内容がありません。保存をスキップします');
    expect(result.changeHistoryId).toBeNull();
  });
});
