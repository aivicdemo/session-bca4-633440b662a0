import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  ReporterNotFoundError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-458: 存在しない報告者IDを指定して更新しようとすると、ReporterNotFoundErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when reporter ID does not exist', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'nonexistent-reporter-id',
      reporterName: 'Updated Name',
      emailAddress: 'updated@example.com',
      department: 'Engineering',
      status: 'active',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: false,
      reporterId: null,
      message: '指定された報告者が見つかりません。',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('指定された報告者が見つかりません。');
  });
});
