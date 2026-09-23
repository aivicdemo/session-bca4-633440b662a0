import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  PersistenceFailureError,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-462: データベースへの更新処理が失敗すると、PersistenceFailureErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail with persistence error when database update fails', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: false,
      reporterId: null,
      message: '報告者情報の更新に失敗しました。',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者情報の更新に失敗しました。');
  });
});
