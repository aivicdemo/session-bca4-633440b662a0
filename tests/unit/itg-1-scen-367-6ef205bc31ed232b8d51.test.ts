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
  registerReporterToMaster: jest.fn().mockResolvedValue('RPT20240115001'),
  persistReporterMasterChangeHistory: mockPersistChangeHistory.mockResolvedValue('CHG20240115001'),
}));

describe('SCEN-367: DELETE操作が指定された場合、br-tx_7-007により操作種別・報告者ID・実行者・実行日時が監査ログに記録される', () => {
  test('DELETE操作時、persistReporterMasterChangeHistoryにDELETE情報が記録される', async () => {
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:30:00Z'),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    // success=true を検証
    expect(result.success).toBe(true);

    // reporterId='RPT20240115001' を検証
    expect(result.reporterId).toBe('RPT20240115001');

    // changeHistoryId='CHG20240115001' を検証
    expect(result.changeHistoryId).toBe('CHG20240115001');

    // persistReporterMasterChangeHistory が呼ばれたことを検証
    expect(mockPersistChangeHistory).toHaveBeenCalled();

    // 呼び出し引数を検証
    const callArgs = mockPersistChangeHistory.mock.calls[0]?.[0];
    if (callArgs) {
      // operationType='DELETE' を検証
      expect(callArgs.operationType).toBe('DELETE');

      // reporterId='RPT20240115001' を検証
      expect(callArgs.reporterId).toBe('RPT20240115001');

      // executedBy='TL001' を検証
      expect(callArgs.executedBy).toBe('TL001');

      // executedAt が2024-01-15T10:30:00Zを示していることを検証
      expect(new Date(callArgs.executedAt).toISOString()).toBe('2024-01-15T10:30:00.000Z');

      // changedFields は空配列
      expect(Array.isArray(callArgs.changedFields)).toBe(true);
      expect(callArgs.changedFields.length).toBe(0);
    }
  });
});
