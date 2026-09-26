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

  it('should fail with PersistenceError when master update fails', async () => {
    (inputValidation.validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (inputValidation.validateEmailAddress as jest.Mock).mockReturnValue(true);
    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockReturnValue(false);
    (persistence.retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId: 'RPT001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      department: '営業部',
      status: 'active',
    });
    (persistence.updateReporterInMaster as jest.Mock).mockImplementation(() => {
      throw new Error('Database write failed');
    });

    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '部署B',
      status: 'inactive',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    try {
      await updateReporter(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as Error).message).toBe('報告者情報の更新に失敗しました。');
    }
  });

  it('should fail with PersistenceError when change history persistence fails', async () => {
    (inputValidation.validateReporterNameFormat as jest.Mock).mockReturnValue(true);
    (inputValidation.validateEmailAddress as jest.Mock).mockReturnValue(true);
    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockReturnValue(false);
    (persistence.retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId: 'RPT001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      department: '営業部',
      status: 'active',
    });
    (persistence.updateReporterInMaster as jest.Mock).mockReturnValue(true);
    (persistence.persistReporterMasterChangeHistory as jest.Mock).mockImplementation(() => {
      throw new Error('Change history persistence failed');
    });

    const input: UpdateReporterInput = {
      reporterId: 'RPT001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '部署B',
      status: 'inactive',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    try {
      await updateReporter(input);
      fail('Expected PersistenceError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as Error).message).toBe('報告者情報の更新に失敗しました。');
    }
  });
});
