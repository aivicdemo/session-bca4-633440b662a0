import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
  UnauthorizedUpdateError,
} from '../../src/logic/reporter-master-management';
import {
  retrieveReporterByUserId,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-377: 実行ユーザーがチームリーダー権限を持たないか異なるチームの報告者を更新しようとすると、UnauthorizedUpdateErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('異なるチームの報告者を更新しようとすると、UnauthorizedUpdateErrorが発生またはエラーハンドリング出力が返される', () => {
    const leaderId = 'leader-A';
    const reporterId = 'reporter-C';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId,
      reporterName: 'Reporter C',
      emailAddress: 'reporter-c@example.com',
      department: '営業部',
      status: 'active',
      teamId: 'team-B',
    });

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: 'Updated Name',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: leaderId,
      executionTimestamp,
    };

    try {
      const result: UpdateReporterOutput = updateReporter(input);
      // エラーハンドリング出力が返される場合
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('この操作を実行する権限がありません。');
      expect(result.changeHistoryId).toBeNull();
    } catch (error) {
      // 例外をスローする場合
      expect(error).toBeInstanceOf(UnauthorizedUpdateError);
      expect((error as Error).message).toContain('この操作を実行する権限がありません。');
    }
  });

  test('存在しない報告者を更新しようとすると、UnauthorizedUpdateErrorが発生またはエラーハンドリング出力が返される', () => {
    const leaderId = 'leader-A';
    const reporterId = 'reporter-nonexistent';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (retrieveReporterByUserId as jest.Mock).mockReturnValue(null);

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: 'Updated Name',
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId: leaderId,
      executionTimestamp,
    };

    try {
      const result: UpdateReporterOutput = updateReporter(input);
      // エラーハンドリング出力が返される場合
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.changeHistoryId).toBeNull();
    } catch (error) {
      // 例外をスローする場合
      expect(error).toBeInstanceOf(UnauthorizedUpdateError);
    }
  });
});
