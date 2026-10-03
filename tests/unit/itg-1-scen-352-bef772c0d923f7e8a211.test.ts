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

describe('SCEN-352: 新規登録操作で、メールアドレスが未登録で、報告者名が存在し、メールアドレス形式が正しい場合、br-tx_7-004により保存可能と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規登録時に検証に合格した場合、保存可能と判定される', async () => {
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
    expect(result.reporterId).toBeTruthy();
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe('string');
    expect(result.message).not.toBe('');
    expect(result.changeHistoryId).not.toBeNull();
    expect(result.changeHistoryId).toBeTruthy();
  });
});
