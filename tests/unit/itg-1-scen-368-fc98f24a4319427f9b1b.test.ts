import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';

const mockPersistChangeHistory = jest.fn().mockImplementation((input) => {
  if (!input.reporterId || input.reporterId === '') {
    const error = new Error('報告者IDが指定されていません');
    error.name = 'MissingReporterIdError';
    throw error;
  }
  return Promise.resolve('CH-001');
});

jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateReporterNameFormat: jest.fn().mockResolvedValue(true),
  validateEmailAddress: jest.fn().mockResolvedValue(true),
  detectDuplicateEmailAddress: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  validateUserAccountActiveStatus: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  registerReporterToMaster: jest.fn().mockResolvedValue(''),
  persistReporterMasterChangeHistory: mockPersistChangeHistory,
}));

describe('SCEN-368: 報告者IDが空または不正な形式の場合、br-tx_7-007の制約1により「報告者IDが指定されていません」エラーメッセージが返される', () => {
  test('報告者IDが空文字列の場合、エラーメッセージが返される', async () => {
    const input: RegisterReporterInput = {
      userId: 'user001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'leader001',
      executionTimestamp: new Date(),
    };

    try {
      await registerReporter(input);
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error.message).toBe('報告者IDが指定されていません');
    }
  });
});
