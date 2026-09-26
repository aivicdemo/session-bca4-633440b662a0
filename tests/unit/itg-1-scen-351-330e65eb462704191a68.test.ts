import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  DuplicateEmailAddressDetected,
} from '../../src/logic/reporter-master-management';

describe('SCEN-351: 同じメールアドレスが既に登録されている場合、br-tx_7-003の制約4により「このメールアドレスは既に登録されています」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールアドレスが既に登録されている場合、DuplicateEmailAddressDetectedエラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'NEW-001',
      reporterName: '山田太郎',
      emailAddress: 'test-reporter@company.jp',
      teamLeaderId: 'TL-001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
