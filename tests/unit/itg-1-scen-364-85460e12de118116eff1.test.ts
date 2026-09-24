import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  DuplicateEmailAddressDetected,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-364: 同じメールアドレスで複数の報告者が登録されている場合、br-tx_7-005の制約3により「このメールアドレスは既に登録されています」エラーメッセージが返される', () => {
  test('既に登録済みのメールアドレスを指定した場合、DuplicateEmailAddressDetectedエラーが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '新規報告者',
      emailAddress: 'existing@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    try {
      await registerReporter(input);
      fail('Expected DuplicateEmailAddressDetected to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateEmailAddressDetected);
      expect(error.message).toContain('このメールアドレスは既に登録されています');
    }
  });
});
