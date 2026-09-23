import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { updateReporter } from '../../src/logic/reporter-master-management';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';
import { UnauthorizedUpdateError } from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-377: UnauthorizedUpdateError when user lacks permission or is in different team', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedUpdateError when reporter belongs to different team', async () => {
    // 報告者C（別チーム）の情報
    const reporterC = {
      reporterId: 'reporter-C',
      reporterName: 'Reporter C',
      emailAddress: 'reporter-c@example.com',
      department: 'Sales',
      status: 'active',
      teamId: 'team-B', // 別のチーム
    };

    // retrieveReporterByUserId がreporter-Cの情報を返す
    (userMasterPersistence.retrieveReporterByUserId as any).mockResolvedValue(reporterC);

    const input = {
      reporterId: 'reporter-C',
      reporterName: 'Updated Name',
      teamLeaderId: 'leader-A', // team-Aに属するリーダー
      executionTimestamp: new Date(),
    };

    // UnauthorizedUpdateError が発生することを期待
    await expect(updateReporter(input)).rejects.toThrow(UnauthorizedUpdateError);

    // エラーメッセージを確認
    try {
      await updateReporter(input);
    } catch (error) {
      if (error instanceof UnauthorizedUpdateError) {
        expect(error.message).toBe('この操作を実行する権限がありません。');
      }
    }

    // updateReporterInMaster と persistReporterMasterChangeHistory が呼ばれていないことを確認
    expect(userMasterPersistence.updateReporterInMaster as any).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory as any).not.toHaveBeenCalled();
  });
});
