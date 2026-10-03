import { updateReporterInMaster, DuplicateEmailAddressError } from '../../src/logic/user-master-persistence';
import type { UpdateReporterInMasterInput, UpdateReporterInMasterOutput } from '../../src/logic/user-master-persistence';

describe('SCEN-459: 他の報告者と重複するメールアドレスに更新しようとすると、DuplicateEmailAddressErrorが発生して失敗を返す', () => {
  it('should throw DuplicateEmailAddressError when email address is already used by another reporter', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'R001',
      reporterName: 'Updated Name',
      emailAddress: 'user2@example.com',
      department: 'Engineering',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp: new Date(),
    };

    await expect(updateReporterInMaster(input)).rejects.toThrow(DuplicateEmailAddressError);
  });

  it('should return UpdateReporterInMasterOutput with success=false when email is duplicated', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'R001',
      reporterName: 'Updated Name',
      emailAddress: 'user2@example.com',
      department: 'Engineering',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp: new Date(),
    };

    try {
      const result = await updateReporterInMaster(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toContain('このメールアドレスは既に別の報告者に登録されています。');
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateEmailAddressError);
      expect((error as Error).message).toContain('このメールアドレスは既に別の報告者に登録されています。');
    }
  });
});
