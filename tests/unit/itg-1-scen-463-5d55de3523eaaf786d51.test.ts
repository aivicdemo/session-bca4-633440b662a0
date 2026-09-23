import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporterInMaster,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-463: 複数の更新可能項目（名前、メールアドレス、部門、ステータス）のいずれかのみを指定して更新すると、指定された項目だけが反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update only reporterName when specified alone', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-001',
      reporterName: '新しい名前',
      emailAddress: undefined,
      department: undefined,
      status: undefined,
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: true,
      reporterId: 'reporter-001',
      message: '報告者情報が正常に更新されました',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);
    jest.mocked(persistReporterMasterChangeHistory).mockResolvedValue({});

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
  });

  it('should update only emailAddress when specified alone', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-002',
      reporterName: undefined,
      emailAddress: 'newemail@example.com',
      department: undefined,
      status: undefined,
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: true,
      reporterId: 'reporter-002',
      message: '報告者情報が正常に更新されました',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-002');
  });

  it('should update only department when specified alone', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-003',
      reporterName: undefined,
      emailAddress: undefined,
      department: '企画部',
      status: undefined,
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: true,
      reporterId: 'reporter-003',
      message: '報告者情報が正常に更新されました',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-003');
  });

  it('should update only status when specified alone', async () => {
    const input: UpdateReporterInMasterInput = {
      reporterId: 'reporter-004',
      reporterName: undefined,
      emailAddress: undefined,
      department: undefined,
      status: 'inactive',
      leaderUserId: 'leader-001',
      updateTimestamp: new Date(),
    };

    const mockResult: UpdateReporterInMasterOutput = {
      success: true,
      reporterId: 'reporter-004',
      message: '報告者情報が正常に更新されました',
    };
    jest.mocked(updateReporterInMaster).mockResolvedValue(mockResult);

    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-004');
  });
});
