import { updateReporterInMaster, PersistenceFailureError } from '../../src/logic/user-master-persistence';
import type { UpdateReporterInMasterInput, UpdateReporterInMasterOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-462: データベースへの更新処理が失敗すると、PersistenceFailureErrorが発生して失敗を返す', () => {
  it('should throw PersistenceFailureError when database update fails', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    await expect(updateReporterInMaster(input)).rejects.toThrow(PersistenceFailureError);
  });

  it('should return UpdateReporterInMasterOutput with success=false and error message', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    try {
      const result = await updateReporterInMaster(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('報告者情報の更新に失敗しました。');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceFailureError);
      expect((error as Error).message).toBe('報告者情報の更新に失敗しました。');
    }
  });

  it('should have PersistenceFailureError name and message matching spec', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'RPT-001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'LEAD-001',
      updateTimestamp: new Date(),
    };

    try {
      await updateReporterInMaster(input);
      fail('Should have thrown PersistenceFailureError');
    } catch (error) {
      expect(error.constructor.name).toBe('PersistenceFailureError');
      expect((error as Error).message).toBe('報告者情報の更新に失敗しました。');
    }
  });
});
