import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';

describe('SCEN-350: メールアドレスが@を含まないか、ドメイン部分がない場合、br-tx_7-003の制約3により「正しいメールアドレス形式で入力してください」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールアドレスが@を含まない不正な形式の場合、InvalidEmailAddressFormatエラーが発生し適切なエラーメッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'test',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date(),
    };

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
