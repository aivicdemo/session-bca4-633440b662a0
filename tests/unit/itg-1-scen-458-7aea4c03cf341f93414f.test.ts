import { updateReporterInMaster, ReporterNotFoundError } from '../../src/logic/user-master-persistence';
import type { UpdateReporterInMasterInput, UpdateReporterInMasterOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-458: 存在しない報告者IDを指定して更新しようとすると、ReporterNotFoundErrorが発生して失敗を返す', () => {
  it('should throw ReporterNotFoundError when reporter ID does not exist', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'nonexistent-reporter-id',
      reporterName: 'Updated Name',
      emailAddress: 'updated@example.com',
      department: 'Engineering',
      status: 'active',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    await expect(updateReporterInMaster(input)).rejects.toThrow(ReporterNotFoundError);
  });

  it('should return UpdateReporterInMasterOutput with success=false when reporter not found', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'nonexistent-reporter-id',
      reporterName: 'Updated Name',
      emailAddress: 'updated@example.com',
      department: 'Engineering',
      status: 'active',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    try {
      const result = await updateReporterInMaster(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('指定された報告者が見つかりません。');
    } catch (error) {
      expect(error).toBeInstanceOf(ReporterNotFoundError);
      expect((error as Error).message).toBe('指定された報告者が見つかりません。');
    }
  });
});
