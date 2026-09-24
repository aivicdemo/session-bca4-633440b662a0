import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  DuplicateEmailAddressError,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-459: 他の報告者と重複するメールアドレスに更新しようとすると、DuplicateEmailAddressErrorが発生して失敗を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail when email address is already used by another reporter', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'R001',
      reporterName: 'Updated Name',
      emailAddress: 'user2@example.com',
      department: 'Engineering',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp: new Date(),
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に別の報告者に登録されています。');
    expect(persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});