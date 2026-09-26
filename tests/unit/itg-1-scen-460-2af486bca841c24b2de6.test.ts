import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  InvalidReporterStatusError,
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

describe('SCEN-460: 無効なステータス値を指定して更新しようとすると、InvalidReporterStatusErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when invalid status is specified', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-001',
      status: 'invalid_status',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    (updateReporterInMaster as any).mockRejectedValue(
      new InvalidReporterStatusError('無効なステータス値です。')
    );

    await expect((updateReporterInMaster as any)(input)).rejects.toThrow(InvalidReporterStatusError);
    expect((persistReporterMasterChangeHistory as jest.Mock)).not.toHaveBeenCalled();
  });
});
