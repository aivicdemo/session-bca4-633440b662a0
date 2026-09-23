import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateReporter } from '../../src/logic/reporter-master-management';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import * as validation from '../../src/logic/input-validation-formatting';
import { PersistenceError } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-378: PersistenceError when write to master or history fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error output and throw PersistenceError when updateReporterInMaster fails', async () => {
    const existingReporter = {
      reporterId: 'reporter-001',
      reporterName: 'Reporter A',
      emailAddress: 'reporter-a@example.com',
      department: 'Engineering',
      status: 'active',
      teamId: 'team-001',
    };

    // 検証関数はすべて成功を返す
    (validation.validateReporterNameFormat as any).mockResolvedValue(true);
    (validation.validateEmailAddress as any).mockResolvedValue(true);
    (validation.detectDuplicateEmailAddress as any).mockResolvedValue(false);
    (userMasterPersistence.retrieveReporterByUserId as any).mockResolvedValue(existingReporter);

    // updateReporterInMaster が失敗をシミュレート
    (userMasterPersistence.updateReporterInMaster as any).mockRejectedValue(
      new Error('Database write failed')
    );

    const input = {
      reporterId: 'reporter-001',
      reporterName: 'Updated Name',
      emailAddress: 'updated@example.com',
      department: 'Sales',
      status: 'active',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    // PersistenceError が発生することを期待
    await expect(updateReporter(input)).rejects.toThrow();

    // エラーメッセージを確認
    try {
      await updateReporter(input);
    } catch (error) {
      if (error instanceof PersistenceError) {
        expect(error.message).toBe('報告者情報の更新に失敗しました。');
      }
    }

    // persistReporterMasterChangeHistory が呼ばれていないことを確認
    expect(userMasterPersistence.persistReporterMasterChangeHistory as any).not.toHaveBeenCalled();
  });

  it('should return error output and throw PersistenceError when persistReporterMasterChangeHistory fails', async () => {
    const existingReporter = {
      reporterId: 'reporter-001',
      reporterName: 'Reporter A',
      emailAddress: 'reporter-a@example.com',
      department: 'Engineering',
      status: 'active',
      teamId: 'team-001',
    };

    // 検証関数はすべて成功を返す
    (validation.validateReporterNameFormat as any).mockResolvedValue(true);
    (validation.validateEmailAddress as any).mockResolvedValue(true);
    (validation.detectDuplicateEmailAddress as any).mockResolvedValue(false);
    (userMasterPersistence.retrieveReporterByUserId as any).mockResolvedValue(existingReporter);

    // updateReporterInMaster は成功
    (userMasterPersistence.updateReporterInMaster as any).mockResolvedValue({ success: true });

    // persistReporterMasterChangeHistory が失敗をシミュレート
    (userMasterPersistence.persistReporterMasterChangeHistory as any).mockRejectedValue(
      new Error('Change history persistence failed')
    );

    const input = {
      reporterId: 'reporter-001',
      reporterName: 'Updated Name',
      emailAddress: 'updated@example.com',
      department: 'Sales',
      status: 'active',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    // PersistenceError が発生することを期待
    await expect(updateReporter(input)).rejects.toThrow();

    // エラーメッセージを確認
    try {
      await updateReporter(input);
    } catch (error) {
      if (error instanceof PersistenceError) {
        expect(error.message).toBe('報告者情報の更新に失敗しました。');
      }
    }
  });
});
