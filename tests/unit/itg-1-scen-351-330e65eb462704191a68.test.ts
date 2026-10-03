import { registerReporter, RegisterReporterInput, RegisterReporterOutput, DuplicateEmailAddressDetected } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  detectDuplicateEmailAddress: jest.fn(),
}));

describe('SCEN-351: 同じメールアドレスが既に登録されている場合、br-tx_7-003の制約4により「このメールアドレスは既に登録されています」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('メールアドレスが既に登録されている場合、エラーメッセージが返される', async () => {
    const mockDetectDuplicateEmailAddress = jest.mocked(inputValidation.detectDuplicateEmailAddress);
    mockDetectDuplicateEmailAddress.mockRejectedValue(
      new DuplicateEmailAddressDetected('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。')
    );

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
