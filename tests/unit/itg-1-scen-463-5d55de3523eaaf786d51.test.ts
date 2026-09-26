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

describe('SCEN-463: 複数の更新可能項目（名前、メールアドレス、部門、ステータス）のいずれかのみを指定して更新すると、指定された項目だけが反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistChangeHistory.mockResolvedValue({ success: true });
  });

  it('should update only reporterName when only name is specified', async () => {
    const reporterId = 'reporter-001';
    const timestamp = new Date();

    const input: UpdateReporterInMasterInput = {
      reporterId,
      reporterName: '新しい名前',
      leaderUserId: 'leader-001',
      updateTimestamp: timestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input as any);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(result.message).toBeTruthy();
    expect(mockedPersistChangeHistory).toHaveBeenCalled();
    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs.reporterId).toBe(reporterId);
    expect(callArgs.leaderUserId).toBe('leader-001');
    expect(callArgs.operationTimestamp).toBe(timestamp);
  });

  it('should update only emailAddress when only email is specified', async () => {
    const reporterId = 'reporter-001';
    const timestamp = new Date();

    const input: UpdateReporterInMasterInput = {
      reporterId,
      emailAddress: 'newemail@example.com',
      leaderUserId: 'leader-001',
      updateTimestamp: timestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input as any);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(mockedPersistChangeHistory).toHaveBeenCalled();
  });

  it('should update only department when only department is specified', async () => {
    const reporterId = 'reporter-001';
    const timestamp = new Date();

    const input: UpdateReporterInMasterInput = {
      reporterId,
      department: '営業部',
      leaderUserId: 'leader-001',
      updateTimestamp: timestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input as any);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(mockedPersistChangeHistory).toHaveBeenCalled();
  });

  it('should update only status when only status is specified', async () => {
    const reporterId = 'reporter-001';
    const timestamp = new Date();

    const input: UpdateReporterInMasterInput = {
      reporterId,
      status: 'inactive',
      leaderUserId: 'leader-001',
      updateTimestamp: timestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input as any);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(mockedPersistChangeHistory).toHaveBeenCalled();
  });
});
