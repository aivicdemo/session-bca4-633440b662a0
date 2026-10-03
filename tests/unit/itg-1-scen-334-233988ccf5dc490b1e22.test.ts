import { registerReporter, RegisterReporterInput, UserNotFoundInUserMaster } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-334: 指定されたユーザーIDがユーザーマスタに存在しない場合、UserNotFoundInUserMasterエラーを返す', () => {
  const nonexistentUserId = 'NONEXISTENT_USER_001';
  const reporterName = '田中太郎';
  const emailAddress = 'tanaka.taro@example.com';
  const teamLeaderId = 'LEADER_001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.clearAllMocks();

    (inputValidation.validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: reporterName,
      errorCode: null,
    });

    (inputValidation.validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: emailAddress,
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: emailAddress,
      errorCode: null,
    });

    (userAuth.validateUserAccountActiveStatus as jest.Mock).mockRejectedValue(
      new UserNotFoundInUserMaster('指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。')
    );
  });

  it('存在しないユーザーIDの場合、success=false、reporterId=null、適切なmessageとchangeHistoryId=nullを返す', async () => {
    const input: RegisterReporterInput = {
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
  });
});
