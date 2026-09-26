import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as persistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-379: すべての更新項目が任意で指定されない場合、現在の値が保持されて成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve existing values when no update fields are specified', async () => {
    (inputValidation.validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (inputValidation.validateEmailAddress as jest.Mock).mockReturnValue(true);
    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockReturnValue(false);
    (persistence.retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      department: '営業部',
      status: 'active',
    });
    (persistence.updateReporterInMaster as jest.Mock).mockReturnValue(true);
    (persistence.persistReporterMasterChangeHistory as jest.Mock).mockReturnValue('CH12345');

    const input: UpdateReporterInput = {
      reporterId: 'R001',
      teamLeaderId: 'L001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toBe('報告者情報の更新が成功しました。');
    expect(result.changeHistoryId).toBe('CH12345');

    const updateCall = (persistence.updateReporterInMaster as jest.Mock).mock.calls[0][0] as any;
    expect(updateCall.reporterId).toBe('R001');
    expect(updateCall.reporterName).toBe('山田太郎');
    expect(updateCall.emailAddress).toBe('yamada@example.com');
    expect(updateCall.department).toBe('営業部');
    expect(updateCall.status).toBe('active');

    const historyCall = (persistence.persistReporterMasterChangeHistory as jest.Mock).mock.calls[0][0] as any;
    expect(historyCall.reporterId).toBe('R001');
    expect(historyCall.teamLeaderId).toBe('L001');
    expect(historyCall.executionTimestamp).toEqual(new Date('2025-01-15T09:00:00Z'));
  });
});
