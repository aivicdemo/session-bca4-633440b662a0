import { updateReporterInMaster, InvalidReporterStatusError } from '../../src/logic/user-master-persistence';
import type { UpdateReporterInMasterInput, UpdateReporterInMasterOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-460: 無効なステータス値を指定して更新しようとすると、InvalidReporterStatusErrorが発生して失敗を返す', () => {
  it('should throw InvalidReporterStatusError when invalid status value is provided', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-001',
      status: 'invalid_status',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    await expect(updateReporterInMaster(input)).rejects.toThrow(InvalidReporterStatusError);
  });

  it('should return UpdateReporterInMasterOutput with success=false and correct error message', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-001',
      status: 'invalid_status',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    try {
      const result = await updateReporterInMaster(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('無効なステータス値です。');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidReporterStatusError);
      expect((error as Error).message).toBe('無効なステータス値です。');
    }
  });
});
