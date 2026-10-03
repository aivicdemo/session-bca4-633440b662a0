import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/reporter-master-persistence');

describe('SCEN-372: チームリーダーが既存報告者の名前を更新すると、変更履歴が記録されて成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームリーダーが既存報告者の名前を更新すると、変更履歴が記録されて成功する', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '田中花子',
      emailAddress: undefined,
      department: undefined,
      status: undefined,
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const {
      validateReporterNameFormat,
      retrieveReporterByUserId,
      updateReporterInMaster,
      persistReporterMasterChangeHistory,
    } = require('../../src/logic/reporter-master-persistence');

    validateReporterNameFormat.mockResolvedValue({ isValid: true });
    retrieveReporterByUserId.mockResolvedValue({
      reporterId: 'RPT001',
      userId: 'USER001',
      reporterName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: '営業部',
      status: 'active',
    });
    updateReporterInMaster.mockResolvedValue({ success: true });
    persistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'CHG20250115001',
    });

    const result: UpdateReporterOutput = await updateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT001');
    expect(result.changeHistoryId).toBe('CHG20250115001');
    expect(result.message).toMatch(/更新されました|正常に更新/);
  });
});
