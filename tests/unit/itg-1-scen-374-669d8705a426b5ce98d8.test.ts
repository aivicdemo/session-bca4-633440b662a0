import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
  DuplicateEmailAddressError,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/reporter-master-persistence');

describe('SCEN-374: 更新後のメールアドレスが同一チーム内の別の有効な報告者と重複すると、DuplicateEmailAddressErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新後のメールアドレスが同一チーム内の別の有効な報告者と重複すると、DuplicateEmailAddressErrorが発生する', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'reporter-001',
      emailAddress: 'reporter-b@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const {
      validateReporterNameFormat,
      validateEmailAddress,
      detectDuplicateEmailAddress,
      retrieveReporterByUserId,
      updateReporterInMaster,
      persistReporterMasterChangeHistory,
    } = require('../../src/logic/reporter-master-persistence');

    validateReporterNameFormat.mockResolvedValue({ isValid: true });
    validateEmailAddress.mockResolvedValue({ isValid: true });
    detectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: true,
      duplicateReporterId: 'reporter-002',
    });
    retrieveReporterByUserId.mockResolvedValue({
      reporterId: 'reporter-001',
      reporterName: '報告者A',
      emailAddress: 'reporter-a@example.com',
      status: 'active',
    });
    updateReporterInMaster.mockResolvedValue({ success: true });
    persistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CHG001',
    });

    // 重複検出時にエラーをスローするか、または失敗結果を返す
    await expect(updateReporter(input)).rejects.toThrow(DuplicateEmailAddressError);

    expect(updateReporterInMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('メールアドレス重複エラーが発生する場合、エラーメッセージと結果が適切に返される', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'reporter-001',
      emailAddress: 'reporter-b@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const {
      validateReporterNameFormat,
      validateEmailAddress,
      detectDuplicateEmailAddress,
      retrieveReporterByUserId,
      updateReporterInMaster,
      persistReporterMasterChangeHistory,
    } = require('../../src/logic/reporter-master-persistence');

    validateReporterNameFormat.mockResolvedValue({ isValid: true });
    validateEmailAddress.mockResolvedValue({ isValid: true });
    detectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: true,
      message: '同一チーム内の別の有効な報告者と重複している',
    });
    retrieveReporterByUserId.mockResolvedValue({
      reporterId: 'reporter-001',
      reporterName: '報告者A',
      emailAddress: 'reporter-a@example.com',
      status: 'active',
    });

    try {
      await updateReporter(input);
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateEmailAddressError);
    }

    expect(updateReporterInMaster).not.toHaveBeenCalled();
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
