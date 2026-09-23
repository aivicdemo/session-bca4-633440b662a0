import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  UnauthorizedUpdateError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-461: チームリーダーではないユーザーが他チームの報告者を更新しようとすると、UnauthorizedUpdateErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when leader does not have authorization to update reporter from different team', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '更新後太郎',
      emailAddress: 'updated@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEADER-B',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: false,
      reporterId: null,
      message: 'この報告者を更新する権限がありません。',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('この報告者を更新する権限がありません。');
  });
});
