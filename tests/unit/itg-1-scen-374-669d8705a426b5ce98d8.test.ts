import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateReporter } from '../../src/logic/reporter-master-management';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import * as validation from '../../src/logic/input-validation-formatting';
import { DuplicateEmailAddressError } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-374: DuplicateEmailAddressError when email conflicts with another reporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error output when email is duplicated within same team', async () => {
    const existingReporter = {
      reporterId: 'reporter-001',
      reporterName: 'Reporter A',
      emailAddress: 'reporter-a@example.com',
      department: 'Engineering',
      status: 'active',
      teamId: 'team-001',
    };

    // 前提条件設定
    (userMasterPersistence.retrieveReporterByUserId as any).mockResolvedValue(existingReporter);
    (validation.validateEmailAddress as any).mockResolvedValue(true);
    (validation.validateReporterNameFormat as any).mockResolvedValue(true);
    (validation.detectDuplicateEmailAddress as any).mockResolvedValue(true); // 重複検出
    (userMasterPersistence.updateReporterInMaster as any).mockResolvedValue({ success: true });

    const input = {
      reporterId: 'reporter-001',
      emailAddress: 'reporter-b@example.com', // 別の報告者のメールアドレス
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    // updateReporter を呼び出し
    const result = await updateReporter(input);

    // 期待結果を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に別の報告者に割り当てられています。');

    // updateReporterInMaster と persistReporterMasterChangeHistory が呼ばれていないことを確認
    expect(userMasterPersistence.updateReporterInMaster as any).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory as any).not.toHaveBeenCalled();
  });
});
