import { registerReporter, RegisterReporterInput, DuplicateEmailAddressDetected } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-333: 入力されたメールアドレスが既にマスタに登録されている場合、DuplicateEmailAddressDetectedエラーを返す', () => {
  const userId = 'USER001';
  const reporterName = '山田太郎';
  const emailAddress = 'yamada@example.com';
  const teamLeaderId = 'LEADER001';
  const executionTimestamp = new Date('2024-01-15T09:00:00Z');

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

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockRejectedValue(
      new DuplicateEmailAddressDetected('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。')
    );

    (userAuth.validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId,
      inactiveReason: null,
    });
  });

  it('重複するメールアドレスが検出され、success=false、reporterId=null、適切なmessageとchangeHistoryId=nullを返す', async () => {
    const input: RegisterReporterInput = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('このメールアドレスは既に登録されています。別のメールアドレスを入力してください。');
    expect(result.changeHistoryId).toBeNull();
  });
});
