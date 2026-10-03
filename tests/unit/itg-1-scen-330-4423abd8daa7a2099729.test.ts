import { registerReporter, RegisterReporterInput, InvalidReporterNameFormat } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');

describe('SCEN-330: 報告者名に許可されていない文字が含まれている場合、InvalidReporterNameFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup stubs
    (inputValidation.validateEmailAddress as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as jest.Mock).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'tanaka@example.com',
      errorCode: null,
    });

    (userAuth.validateUserAccountActiveStatus as jest.Mock).mockResolvedValue({
      isActive: true,
      userId: 'USER001',
    });
  });

  it('should return InvalidReporterNameFormat error when reporter name contains forbidden characters', async () => {
    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '田中@太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: now,
    };

    (inputValidation.validateReporterNameFormat as jest.Mock).mockRejectedValue(
      new InvalidReporterNameFormat(
        '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
      )
    );

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

  });
});
