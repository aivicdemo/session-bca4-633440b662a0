import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
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

const mockedPersistChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-464: 報告者情報を更新すると、変更履歴が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistChangeHistory.mockResolvedValue({ success: true });
  });

  it('should record change history when reporter info is updated', async () => {
    const timestamp = new Date();
    const input: UpdateReporterInMasterInput = {
      reporterId: 'R001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp: timestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input as any);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toBeTruthy();

    expect(mockedPersistChangeHistory).toHaveBeenCalled();
    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs.reporterId).toBe('R001');
    expect(callArgs.leaderUserId).toBe('L001');
    expect(callArgs.operationTimestamp).toBe(timestamp);
  });
});
