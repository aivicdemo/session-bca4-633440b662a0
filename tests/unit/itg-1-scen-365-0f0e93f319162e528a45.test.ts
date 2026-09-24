import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

const mockRecordMasterChangeLog = jest.fn();

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn().mockResolvedValue('RPT-2024-001'),
  persistReporterMasterChangeHistory: jest.fn().mockResolvedValue('CHG-2024-0001'),
  recordMasterChangeLog: mockRecordMasterChangeLog,
}));

describe('SCEN-365: CREATE操作で報告者IDと必要な情報が指定された場合、br-tx_7-007により操作種別・報告者ID・実行者・実行日時が監査ログに記録される', () => {
  test('新規登録時、recordMasterChangeLogにCREATE情報が記録される', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp: new Date('2024-01-15T10:30:00Z'),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    // success=true を検証
    expect(result.success).toBe(true);

    // reporterId='RPT-2024-001' を検証
    expect(result.reporterId).toBe('RPT-2024-001');

    // changeHistoryId='CHG-2024-0001' を検証
    expect(result.changeHistoryId).toBe('CHG-2024-0001');

    // recordMasterChangeLog が呼ばれたことを検証
    expect(mockRecordMasterChangeLog).toHaveBeenCalled();

    // 呼び出し引数から operationType='CREATE'、reporterId='RPT-2024-001'、executedBy='LEAD001'、executedAt を検証
    const callArgs = mockRecordMasterChangeLog.mock.calls[0]?.[0];
    if (callArgs) {
      expect(callArgs.operationType).toBe('CREATE');
      expect(callArgs.reporterId).toBe('RPT-2024-001');
      expect(callArgs.executedBy).toBe('LEAD001');
      expect(new Date(callArgs.executedAt).toISOString()).toBe('2024-01-15T10:30:00.000Z');
    }
  });
});
