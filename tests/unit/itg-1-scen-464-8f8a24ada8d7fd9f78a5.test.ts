import { jest } from '@jest/globals';
import {
  updateReporterInMaster,
  persistReporterMasterChangeHistory,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
  PersistReporterMasterChangeHistoryInput,
  PersistReporterMasterChangeHistoryOutput,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-464: 報告者情報を更新すると、変更履歴が記録される', () => {
  let mockPersistReporterMasterChangeHistory: jest.MockedFunction<
    (input: PersistReporterMasterChangeHistoryInput) => Promise<PersistReporterMasterChangeHistoryOutput>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<
      (input: PersistReporterMasterChangeHistoryInput) => Promise<PersistReporterMasterChangeHistoryOutput>
    >;
    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'history-001',
      message: '変更履歴が正常に記録されました。',
    });
  });

  it('updateReporterInMaster が呼ばれると、success=true、reporterId、メッセージが返される。同時に persistReporterMasterChangeHistory が呼ばれ、正しい変更履歴が記録される', async () => {
    // テスト入力値の準備
    const input: UpdateReporterInMasterInput = {
      reporterId: 'R001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp: new Date('2026-09-23T10:00:00Z'),
    };

    // 関数を実行
    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    // 期待結果を検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).not.toBe('');
    expect(result.message).toBeTruthy();

    // persistReporterMasterChangeHistory がスタブ経由で呼ばれたことを確認
    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalled();

    // persistReporterMasterChangeHistory の呼び出し引数を検証
    const callArgs = mockPersistReporterMasterChangeHistory.mock.calls[0][0];
    expect(callArgs).toBeDefined();

    // reporterId が含まれていることを確認
    expect(callArgs.reporterId).toBe('R001');

    // leaderUserId が含まれていることを確認
    expect(callArgs.leaderUserId).toBe('L001');

    // updateTimestamp（operationTimestamp）が含まれていることを確認
    expect(callArgs.operationTimestamp).toEqual(new Date('2026-09-23T10:00:00Z'));

    // 更新内容（newValues）に新しい値が含まれていることを確認
    expect(callArgs.newValues).toBeDefined();
    expect(callArgs.newValues?.reporterName).toBe('新しい名前');
    expect(callArgs.newValues?.emailAddress).toBe('new@example.com');
    expect(callArgs.newValues?.department).toBe('営業部');
    expect(callArgs.newValues?.status).toBe('active');

    // previousValues（更新前の値）が含まれていることを確認
    expect(callArgs.previousValues).toBeDefined();
  });
});
