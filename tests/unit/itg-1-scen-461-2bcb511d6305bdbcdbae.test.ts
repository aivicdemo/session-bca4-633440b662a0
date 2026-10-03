import { updateReporterInMaster, UnauthorizedUpdateError } from '../../src/logic/user-master-persistence';
import type { UpdateReporterInMasterInput, UpdateReporterInMasterOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-461: チームリーダーではないユーザーが他チームの報告者を更新しようとすると、UnauthorizedUpdateErrorが発生して失敗を返す', () => {
  it('should throw UnauthorizedUpdateError when leader does not have authority over the reporter', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '更新後太郎',
      emailAddress: 'updated@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEADER-B',
      updateTimestamp: new Date(),
    };

    await expect(updateReporterInMaster(input)).rejects.toThrow(UnauthorizedUpdateError);
  });

  it('should return UpdateReporterInMasterOutput with success=false and proper message', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '更新後太郎',
      emailAddress: 'updated@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEADER-B',
      updateTimestamp: new Date(),
    };

    try {
      const result = await updateReporterInMaster(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('この報告者を更新する権限がありません。');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedUpdateError);
      expect((error as Error).message).toBe('この報告者を更新する権限がありません。');
    }
  });
});
