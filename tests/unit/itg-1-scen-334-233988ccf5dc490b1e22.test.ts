jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, UserNotFoundInUserMaster } from '../../src/logic/reporter-master-management';
import { validateEmailAddress, validateReporterNameFormat, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-334: 指定されたユーザーIDがユーザーマスタに存在しない場合、UserNotFoundInUserMasterエラーを返す', () => {
  const nonexistentUserId = 'NONEXISTENT_USER_001';
  const reporterName = '田中太郎';
  const emailAddress = 'tanaka.taro@example.com';
  const teamLeaderId = 'LEADER_001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true, validatedReporterName: reporterName, errorCode: null });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true, validatedEmailAddress: emailAddress, errorCode: null });
    mockedDetectDuplicateEmailAddress.mockResolvedValue({ isDuplicate: false, validatedEmailAddress: emailAddress, errorCode: null });
    mockedValidateUserAccountActiveStatus.mockRejectedValue(new UserNotFoundInUserMaster('User not found'));
  });

  it('存在しないユーザーIDの場合、success=false、reporterId=null、適切なmessageとchangeHistoryId=nullを返す', async () => {
    const input = {
      userId: nonexistentUserId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
