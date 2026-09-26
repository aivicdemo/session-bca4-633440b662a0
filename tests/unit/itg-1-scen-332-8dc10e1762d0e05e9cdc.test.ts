jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, InvalidEmailAddressFormat } from '../../src/logic/reporter-master-management';
import { validateEmailAddress, validateReporterNameFormat, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-332: メールアドレスが標準的なメールアドレス形式に違反している場合、InvalidEmailAddressFormatエラーを返す', () => {
  const validUserId = 'valid-user-id';
  const validReporterName = '有効な報告者名';
  const validTeamLeaderId = 'valid-team-leader-id';
  const executionTimestamp = new Date('2024-01-15T09:00:00Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: '有効な報告者名', errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: null, errorCode: null });
    mockedValidateUserAccountActiveStatus.mockResolvedValue({ isActive: true, userId: validUserId, inactiveReason: null });
  });

  it('メールアドレスに@がない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    mockedValidateEmailAddress.mockRejectedValue(new InvalidEmailAddressFormat('Invalid email format'));

    const input = {
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
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('ドメイン部分がない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    mockedValidateEmailAddress.mockRejectedValue(new InvalidEmailAddressFormat('Invalid email format'));

    const input = {
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
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('@の後ろに.がない場合、InvalidEmailAddressFormatエラーを返す', async () => {
    mockedValidateEmailAddress.mockRejectedValue(new InvalidEmailAddressFormat('Invalid email format'));

    const input = {
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
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
