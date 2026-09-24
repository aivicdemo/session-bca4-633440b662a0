import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
  PersistenceError,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as persistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-378: 報告者マスタまたは変更履歴テーブルへの書き込みに失敗すると、PersistenceErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure output and throw PersistenceError when reporter master write fails', () => {
    const mockValidateName = jest.spyOn(inputValidation, 'validateReporterNameFormat' as any);
    mockValidateName.mockReturnValue(true);

    const mockValidateEmail = jest.spyOn(inputValidation, 'validateEmailAddress' as any);
    mockValidateEmail.mockReturnValue(true);

    const mockDetectDuplicate = jest.spyOn(inputValidation, 'detectDuplicateEmailAddress' as any);
    mockDetectDuplicate.mockReturnValue(false);

    const mockRetrieveReporter = jest.spyOn(persistence, 'retrieveReporterByUserId' as any);
    mockRetrieveReporter.mockReturnValue({
      reporterId: 'RPT001',
      reporterName: '既存名前',
      emailAddress: 'existing@example.com',
      department: '部署A',
      status: 'active',
    });

    const mockUpdateMaster = jest.spyOn(persistence, 'updateReporterInMaster' as any);
    mockUpdateMaster.mockImplementation(() => {
      throw new Error('Database write failed');
    });

    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '部署B',
      status: 'active',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    let thrownError: any;
    let result: UpdateReporterOutput | undefined;

    try {
      result = updateReporter(input);
    } catch (error) {
      thrownError = error;
    }

    expect(result?.success).toBe(false);
    expect(result?.reporterId).toBeNull();
    expect(result?.changeHistoryId).toBeNull();
    expect(result?.message).toBe('報告者情報の更新に失敗しました。');
    expect(thrownError).toBeInstanceOf(PersistenceError);
  });

  it('should return failure output and throw PersistenceError when change history persistence fails', () => {
    const mockValidateName = jest.spyOn(inputValidation, 'validateReporterNameFormat' as any);
    mockValidateName.mockReturnValue(true);

    const mockValidateEmail = jest.spyOn(inputValidation, 'validateEmailAddress' as any);
    mockValidateEmail.mockReturnValue(true);

    const mockDetectDuplicate = jest.spyOn(inputValidation, 'detectDuplicateEmailAddress' as any);
    mockDetectDuplicate.mockReturnValue(false);

    const mockRetrieveReporter = jest.spyOn(persistence, 'retrieveReporterByUserId' as any);
    mockRetrieveReporter.mockReturnValue({
      reporterId: 'RPT001',
      reporterName: '既存名前',
      emailAddress: 'existing@example.com',
      department: '部署A',
      status: 'active',
    });

    const mockUpdateMaster = jest.spyOn(persistence, 'updateReporterInMaster' as any);
    mockUpdateMaster.mockReturnValue(true);

    const mockPersistHistory = jest.spyOn(persistence, 'persistReporterMasterChangeHistory' as any);
    mockPersistHistory.mockImplementation(() => {
      throw new Error('Change history persistence failed');
    });

    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '部署B',
      status: 'active',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    let thrownError: any;
    let result: UpdateReporterOutput | undefined;

    try {
      result = updateReporter(input);
    } catch (error) {
      thrownError = error;
    }

    expect(result?.success).toBe(false);
    expect(result?.reporterId).toBeNull();
    expect(result?.changeHistoryId).toBeNull();
    expect(result?.message).toBe('報告者情報の更新に失敗しました。');
    expect(thrownError).toBeInstanceOf(PersistenceError);
  });
});
