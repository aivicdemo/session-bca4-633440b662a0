jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
  updateReporterInMaster: jest.requireActual('../../src/logic/user-master-persistence').updateReporterInMaster,
}));

import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

const mockedPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-463: 複数の更新可能項目（名前、メールアドレス、部門、ステータス）のいずれかのみを指定して更新すると、指定された項目だけが反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistChangeHistory.mockResolvedValue({ success: true });
  });

  it('報告者名のみを更新した場合、指定された項目だけがデータベースに反映される', async () => {
    const reporterId = 'reporter-001';
    const leaderUserId = 'leader-001';
    const updateTimestamp = new Date('2026-01-15T10:00:00Z');

    const input: UpdateReporterInMasterInput = {
      reporterId,
      reporterName: '新しい名前',
      emailAddress: undefined,
      department: undefined,
      status: undefined,
      leaderUserId,
      updateTimestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(result.message).toBeTruthy();

    expect(mockedPersistChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId,
        leaderUserId,
        updateTimestamp,
      })
    );

    // 呼び出し時の引数から指定された項目のみが含まれることを確認
    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs).toHaveProperty('reporterName', '新しい名前');
  });

  it('メールアドレスのみを更新した場合、指定された項目だけがデータベースに反映される', async () => {
    const reporterId = 'reporter-002';
    const leaderUserId = 'leader-001';
    const updateTimestamp = new Date('2026-01-15T11:00:00Z');
    const newEmail = 'newemail@example.com';

    const input: UpdateReporterInMasterInput = {
      reporterId,
      reporterName: undefined,
      emailAddress: newEmail,
      department: undefined,
      status: undefined,
      leaderUserId,
      updateTimestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(result.message).toBeTruthy();

    expect(mockedPersistChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId,
        leaderUserId,
        updateTimestamp,
      })
    );

    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs).toHaveProperty('emailAddress', newEmail);
  });

  it('部門のみを更新した場合、指定された項目だけがデータベースに反映される', async () => {
    const reporterId = 'reporter-003';
    const leaderUserId = 'leader-002';
    const updateTimestamp = new Date('2026-01-15T12:00:00Z');
    const newDepartment = '企画部';

    const input: UpdateReporterInMasterInput = {
      reporterId,
      reporterName: undefined,
      emailAddress: undefined,
      department: newDepartment,
      status: undefined,
      leaderUserId,
      updateTimestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(result.message).toBeTruthy();

    expect(mockedPersistChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId,
        leaderUserId,
        updateTimestamp,
      })
    );

    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs).toHaveProperty('department', newDepartment);
  });

  it('ステータスのみを更新した場合、指定された項目だけがデータベースに反映される', async () => {
    const reporterId = 'reporter-004';
    const leaderUserId = 'leader-001';
    const updateTimestamp = new Date('2026-01-15T13:00:00Z');
    const newStatus = 'inactive';

    const input: UpdateReporterInMasterInput = {
      reporterId,
      reporterName: undefined,
      emailAddress: undefined,
      department: undefined,
      status: newStatus,
      leaderUserId,
      updateTimestamp,
    };

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(result.message).toBeTruthy();

    expect(mockedPersistChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId,
        leaderUserId,
        updateTimestamp,
      })
    );

    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs).toHaveProperty('status', newStatus);
  });
});
