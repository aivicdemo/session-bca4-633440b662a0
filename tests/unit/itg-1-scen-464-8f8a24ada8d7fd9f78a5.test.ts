jest.mock('../../src/logic/user-master-persistence', () => ({
  persistReporterMasterChangeHistory: jest.fn(),
  updateReporterInMaster: jest.requireActual('../../src/logic/user-master-persistence').updateReporterInMaster,
}));

import {
  updateReporterInMaster,
  persistReporterMasterChangeHistory,
  UpdateReporterInMasterInput,
  UpdateReporterInMasterOutput,
} from '../../src/logic/user-master-persistence';

const mockedPersistChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-464: 報告者情報を更新すると、変更履歴が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'history-001',
    });
  });

  it('報告者情報を更新すると、変更履歴が記録される', async () => {
    // テスト入力値の準備: reporterId='R001', reporterName='新しい名前', emailAddress='new@example.com',
    // department='営業部', status='active', leaderUserId='L001', updateTimestamp=現在時刻
    const updateTimestamp = new Date('2026-09-23T10:00:00Z');
    const input: UpdateReporterInMasterInput = {
      reporterId: 'R001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '営業部',
      status: 'active',
      leaderUserId: 'L001',
      updateTimestamp,
    };

    // updateReporterInMaster を上記入力値で呼び出す
    const result: UpdateReporterInMasterOutput = await updateReporterInMaster(input);

    // 戻り値の success フィールドが true であることを確認する
    expect(result.success).toBe(true);

    // 戻り値の reporterId が 'R001' であることを確認する
    expect(result.reporterId).toBe('R001');

    // 戻り値の message フィールドが空でないこと（成功メッセージが含まれること）を確認する
    expect(result.message).toBeTruthy();
    expect(result.message).not.toBe('');

    // persistReporterMasterChangeHistory がスタブ経由で呼び出されたことを確認する
    expect(mockedPersistChangeHistory).toHaveBeenCalled();

    // persistReporterMasterChangeHistory の呼び出し時の引数を検証
    const callArgs = mockedPersistChangeHistory.mock.calls[0][0];
    expect(callArgs).toBeDefined();

    // reporterId='R001' が含まれていることを確認する
    expect(callArgs.reporterId).toBe('R001');

    // leaderUserId='L001' が含まれていることを確認する
    expect(callArgs.leaderUserId).toBe('L001');

    // updateTimestamp が含まれていることを確認する
    expect(callArgs.updateTimestamp).toEqual(updateTimestamp);

    // 更新内容（reporterName='新しい名前'、emailAddress='new@example.com'、department='営業部'、status='active'）を含む変更履歴が記録されること
    expect(callArgs.reporterName).toBe('新しい名前');
    expect(callArgs.emailAddress).toBe('new@example.com');
    expect(callArgs.department).toBe('営業部');
    expect(callArgs.status).toBe('active');
  });
});
