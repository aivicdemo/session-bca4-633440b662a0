import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';

describe('SCEN-349: メールアドレスが空の場合、br-tx_7-003の制約2により「メールアドレスは必須です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emailAddress=空文字列の場合、InvalidEmailAddressFormatエラーが発生し、エラーメッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: '',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
