import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  InvalidReporterStatusError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-460: 無効なステータス値を指定して更新しようとすると、InvalidReporterStatusErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when invalid status value is specified', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-001',
      reporterName: undefined,
      emailAddress: undefined,
      department: undefined,
      status: 'invalid_status',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: false,
      reporterId: null,
      message: '無効なステータス値です。',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('無効なステータス値です。');
  });
});
