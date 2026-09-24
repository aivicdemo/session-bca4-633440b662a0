import {
  deactivateReporterInMaster,
  persistReporterMasterChangeHistory,
  PersistenceFailureError,
  type DeactivateReporterInMasterInput,
  type DeactivateReporterInMasterOutput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence', () => {
  const actual = jest.requireActual('../../src/logic/user-master-persistence');
  return {
    ...actual,
    persistReporterMasterChangeHistory: jest.fn(),
  };
});

const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-470: 報告者マスタの更新がデータベース障害で失敗する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistReporterMasterChangeHistory.mockImplementation(() => {
      throw new PersistenceFailureError();
    });
  });

  it('success値がfalseである', () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    const result = deactivateReporterInMaster(input) as DeactivateReporterInMasterOutput;

    expect(result.success).toBe(false);
  });

  it('reporterIdがnullである', () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    const result = deactivateReporterInMaster(input) as DeactivateReporterInMasterOutput;

    expect(result.reporterId).toBeNull();
  });

  it('messageが「報告者の無効化処理中にシステムエラーが発生しました。」である', () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    const result = deactivateReporterInMaster(input) as DeactivateReporterInMasterOutput;

    expect(result.message).toBe('報告者の無効化処理中にシステムエラーが発生しました。');
  });

  it('PersistenceFailureErrorがスロー、またはエラーレスポンスとして返却される', () => {
    const input: DeactivateReporterInMasterInput = {
      reporterId: 'reporter-123',
      leaderUserId: 'leader-001',
      deactivationTimestamp: new Date('2025-01-15T10:30:00Z'),
      deactivationReason: '異動',
    };

    const result = deactivateReporterInMaster(input);

    // 処理が実行されたことを確認
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();

    // 戻り値がエラーレスポンスであることを確認
    expect((result as DeactivateReporterInMasterOutput).success).toBe(false);
  });
});
