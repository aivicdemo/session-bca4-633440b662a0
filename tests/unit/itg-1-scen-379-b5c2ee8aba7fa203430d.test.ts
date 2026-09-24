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

  it('should preserve existing values when no update fields are specified', () => {
    const mockValidateName = jest.spyOn(inputValidation, 'validateReporterNameFormat' as any);
    mockValidateName.mockReturnValue(true);

    const mockValidateEmail = jest.spyOn(inputValidation, 'validateEmailAddress' as any);
    mockValidateEmail.mockReturnValue(true);

    const mockDetectDuplicate = jest.spyOn(inputValidation, 'detectDuplicateEmailAddress' as any);
    mockDetectDuplicate.mockReturnValue(false);

    const mockRetrieveReporter = jest.spyOn(persistence, 'retrieveReporterByUserId' as any);
    mockRetrieveReporter.mockReturnValue({
      reporterId: 'R001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      department: '営業部',
      status: 'active',
    });

    const mockUpdateMaster = jest.spyOn(persistence, 'updateReporterInMaster' as any);
    mockUpdateMaster.mockReturnValue(true);

    const mockPersistHistory = jest.spyOn(persistence, 'persistReporterMasterChangeHistory' as any);
    mockPersistHistory.mockReturnValue('CH12345');

    const input: UpdateReporterInput = {
      reporterId: 'R001',
      reporterName: undefined,
      emailAddress: undefined,
      department: undefined,
      status: undefined,
      teamLeaderId: 'L001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    const result = updateReporter(input) as UpdateReporterOutput;

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toBe('報告者情報の更新が成功しました。');
    expect(result.changeHistoryId).toBe('CH12345');

    // verify updateReporterInMaster was called with existing values
    expect(mockUpdateMaster).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'R001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
        department: '営業部',
        status: 'active',
      })
    );

    // verify persistReporterMasterChangeHistory was called with correct parameters
    expect(mockPersistHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'R001',
        teamLeaderId: 'L001',
        executionTimestamp: new Date('2025-01-15T09:00:00Z'),
      })
    );
  });
});
