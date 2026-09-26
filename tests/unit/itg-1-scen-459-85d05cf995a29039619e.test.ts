import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  DuplicateEmailAddressError,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

interface UpdateReporterInMasterInput {
  reporterId: string;
  reporterName?: string;
  emailAddress?: string;
  department?: string;
  status?: string;
  leaderUserId: string;
  updateTimestamp: Date;
}

interface UpdateReporterInMasterOutput {
  success: boolean;
  reporterId: string | null;
  message: string;
}

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

    (updateReporterInMaster as any).mockRejectedValue(
      new DuplicateEmailAddressError('このメールアドレスは既に別の報告者に登録されています。')
    );

    await expect((updateReporterInMaster as any)(input)).rejects.toThrow(DuplicateEmailAddressError);
    expect((persistReporterMasterChangeHistory as jest.Mock)).not.toHaveBeenCalled();
  });
});
