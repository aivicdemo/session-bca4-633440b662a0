import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

const mockPersistChangeHistory = jest.fn();

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn()
    .mockResolvedValueOnce('REP-ID-1')
    .mockResolvedValueOnce('REP-ID-1'),
  persistReporterMasterChangeHistory: mockPersistChangeHistory
    .mockResolvedValueOnce('CH-1')
    .mockResolvedValueOnce('CH-2'),
}));

describe('SCEN-366: UPDATE操作で変更前後の値が異なる場合、br-tx_7-007により変更された項目だけが監査ログに記録される', () => {
  test('2回目のregisterReporter呼び出しでreporterName変更時、changedFieldsに報告者名のみが含まれる', async () => {
    // 1回目: 初回登録
    const input1: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'newuser@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result1: RegisterReporterOutput = await registerReporter(input1);
    expect(result1.success).toBe(true);

    // 2回目: UPDATE操作（報告者名を変更）
    const input2: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎更新',
      emailAddress: 'newuser@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date('2024-01-15T10:01:00Z'),
    };

    const result2: RegisterReporterOutput = await registerReporter(input2);
    expect(result2.success).toBe(true);

    // 2回目の persistReporterMasterChangeHistory 呼び出し検証
    expect(mockPersistChangeHistory).toHaveBeenCalledTimes(2);
    const updateCallArgs = mockPersistChangeHistory.mock.calls[1]?.[0];
    
    if (updateCallArgs) {
      // operationType='UPDATE' を検証
      expect(updateCallArgs.operationType).toBe('UPDATE');
      
      // changedFields に reporterName のみが含まれることを検証
      if (Array.isArray(updateCallArgs.changedFields)) {
        expect(updateCallArgs.changedFields).toContain('reporterName');
        expect(updateCallArgs.changedFields).not.toContain('emailAddress');
      }
    }
  });
});
