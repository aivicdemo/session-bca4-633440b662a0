import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

describe('SCEN-352: 新規登録操作で、メールアドレスが未登録で、報告者名が存在し、メールアドレス形式が正しい場合、br-tx_7-004により保存可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規登録時に検証に合格した場合、br-tx_7-004により保存可能と判定される', async () => {
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).not.toBeNull();
    expect(result.reporterId).toBeTruthy();
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
    expect(result.message).not.toBe('');
    expect(result.changeHistoryId).not.toBeNull();
    expect(result.changeHistoryId).toBeTruthy();
  });
});
