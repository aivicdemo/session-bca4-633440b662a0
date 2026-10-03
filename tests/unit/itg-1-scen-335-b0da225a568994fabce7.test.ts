import { registerReporter, RegisterReporterInput, UserNotFoundInUserMaster } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-335: 指定されたユーザーIDのステータスが無効な場合、UserNotFoundInUserMasterエラーを返す', () => {
  const now = new Date('2024-01-15T10:00:00Z');
  const input: RegisterReporterInput = {
    userId: 'USER-999',
    reporterName: '山田太郎',
    emailAddress: 'yamada@example.com',
    teamLeaderId: 'LEADER-001',
    executionTimestamp: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (inputValidation.validateReporterNameFormat as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    (inputValidation.validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });
  });

  it('ユーザーのステータスが無効な場合、success=false、reporterId=null、適切なmessageとchangeHistoryId=nullを返す', async () => {
    (userAuth.validateUserAccountActiveStatus as jest.Mock).mockRejectedValue(
      new UserNotFoundInUserMaster('指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。')
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('指定されたユーザーはシステムに登録されていません。ユーザーマスタを確認してください。');
    expect(result.changeHistoryId).toBeNull();

  });
});
