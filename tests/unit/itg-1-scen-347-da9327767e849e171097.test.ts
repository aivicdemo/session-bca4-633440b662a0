import { registerReporter, RegisterReporterInput, RegisterReporterOutput } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as authModule from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
  validateUserAccountActiveStatus: jest.fn(),
}));

describe('SCEN-347: 報告者名が入力され、メールアドレスが入力され、メールアドレス形式が正しく、重複がない場合、br-tx_7-003により有効判定で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者名、メールアドレスが入力され、形式が正しく、重複がない場合、RegisterReporterOutput が成功で返される', async () => {
    const mockValidateReporterNameFormat = jest.mocked(inputValidation.validateReporterNameFormat);
    const mockValidateEmailAddress = jest.mocked(inputValidation.validateEmailAddress);
    const mockDetectDuplicateEmailAddress = jest.mocked(inputValidation.detectDuplicateEmailAddress);
    const mockValidateUserAccountActiveStatus = jest.mocked(authModule.validateUserAccountActiveStatus);

    mockValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: '山田太郎', errorCode: null });
    mockValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: 'yamada@example.com', errorCode: null });
    mockDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: 'yamada@example.com', errorCode: null });
    mockValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true, userId: 'USER001' });

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
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
    expect(result.changeHistoryId).not.toBeNull();
  });
});
