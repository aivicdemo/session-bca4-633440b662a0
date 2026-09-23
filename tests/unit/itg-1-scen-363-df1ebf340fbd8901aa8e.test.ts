import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-363: 削除対象の報告者が過去7日間に日報を提出している場合、警告メッセージが返される', () => {
  it('過去7日間に日報を提出していると警告メッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'reporter-001',
      reporterName: '削除対象者',
      emailAddress: 'delete@example.com',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toBe(
      'この報告者は最近日報を提出しています。削除してよろしいですか'
    );
  });
});
