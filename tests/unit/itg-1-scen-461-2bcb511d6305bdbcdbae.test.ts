import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UnauthorizedUpdateError,
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

describe('SCEN-461: チームリーダーではないユーザーが他チームの報告者を更新しようとすると、UnauthorizedUpdateErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when unauthorized leader tries to update reporter from another team', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '更新後太郎',
      emailAddress: 'updated@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEADER-B',
      updateTimestamp: new Date(),
    };

    (updateReporterInMaster as any).mockRejectedValue(
      new UnauthorizedUpdateError('この報告者を更新する権限がありません。')
    );

    await expect((updateReporterInMaster as any)(input)).rejects.toThrow(UnauthorizedUpdateError);
    expect((persistReporterMasterChangeHistory as jest.Mock)).not.toHaveBeenCalled();
  });
});
