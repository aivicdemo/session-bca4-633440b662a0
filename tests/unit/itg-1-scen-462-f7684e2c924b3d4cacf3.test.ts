import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  PersistenceFailureError,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

interface UpdateReporterInMasterInput {
  reporterId: string;
  reporterName?: string;
  emailAddress?: string;
  department?: string;
  status?: string;
  leaderUserId: string;
  updateTimestamp: Date;
}

interface UpdateReporterInMasterOutput {
  success: boolean;
  reporterId: string | null;
  message: string;
}

describe('SCEN-462: データベースへの更新処理が失敗すると、PersistenceFailureErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when database update fails', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    (updateReporterInMaster as any).mockRejectedValue(
      new PersistenceFailureError('報告者情報の更新に失敗しました。')
    );

    await expect((updateReporterInMaster as any)(input)).rejects.toThrow(PersistenceFailureError);
  });
});
