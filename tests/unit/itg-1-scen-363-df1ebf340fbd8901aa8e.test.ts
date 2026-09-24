import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
  syncReporterMasterToSystem: jest.fn().mockResolvedValue({
    syncTimestamp: new Date(),
    nextReportingTargets: [],
    warningMessage: 'この報告者は最近日報を提出しています。削除してよろしいですか',
  }),
}));

describe('SCEN-363: 削除対象の報告者が過去7日間に日報を提出している場合、br-tx_7-005の制約2により「この報告者は最近日報を提出しています。削除してよろしいですか」警告メッセージが返される', () => {
  test('削除対象が過去7日間に日報を提出している場合、警告メッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'reporter-001',
      reporterName: '削除対象者',
      emailAddress: 'delete@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    // success=false を検証
    expect(result.success).toBe(false);

    // message に警告文言が含まれることを検証
    expect(result.message).toContain('この報告者は最近日報を提出しています。削除してよろしいですか');

    // reporterId=null、changeHistoryId=null を検証
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
  });
});
