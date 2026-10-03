import { registerReporter, RegisterReporterInput, InvalidEmailAddressFormat } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-332: メールアドレスが標準的なメールアドレス形式に違反している場合、InvalidEmailAddressFormatエラーを返す', () => {
  const validUserId = 'valid-user-id';
  const validReporterName = '有効な報告者名';
  const validTeamLeaderId = 'valid-team-leader-id';
  const executionTimestamp = new Date('2024-01-15T09:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (inputValidation.validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: '有効な報告者名',
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: null,
    });

    (userAuth.validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId: validUserId,
      inactiveReason: null,
    });
  });

  it('メールアドレスに@がない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    (inputValidation.validateEmailAddress as jest.Mock).mockRejectedValue(
      new InvalidEmailAddressFormat('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。')
    );

    const input: RegisterReporterInput = {
      userId: validUserId,
      reporterName: validReporterName,
      emailAddress: 'invalid-email-no-at',
      teamLeaderId: validTeamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });

  it('ドメイン部分がない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    (inputValidation.validateEmailAddress as jest.Mock).mockRejectedValue(
      new InvalidEmailAddressFormat('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。')
    );

    const input: RegisterReporterInput = {
      userId: validUserId,
      reporterName: validReporterName,
      emailAddress: 'test@',
      teamLeaderId: validTeamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });

  it('@の後ろに.がない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    (inputValidation.validateEmailAddress as jest.Mock).mockRejectedValue(
      new InvalidEmailAddressFormat('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。')
    );

    const input: RegisterReporterInput = {
      userId: validUserId,
      reporterName: validReporterName,
      emailAddress: 'test@domaincom',
      teamLeaderId: validTeamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
