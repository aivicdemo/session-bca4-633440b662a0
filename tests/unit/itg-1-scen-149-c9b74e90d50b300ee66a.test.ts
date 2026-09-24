jest.mock('../../src/logic/input-validation-formatting', () => {
  const actualModule = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actualModule,
    validateEmailAddress: jest.fn(),
  };
});

import { validateUserInformationRequired, validateEmailAddress } from '../../src/logic/input-validation-formatting';

const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;

describe('SCEN-149: 複数フィールドで検証失敗が発生した場合、最初に検出されたエラーコードが優先されてerrorDetailsに全失敗が記録される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('userName=null, emailAddress=invalid-email, department=null の場合、UserNameEmptyErrorが優先され、errorDetailsに3つの失敗が記録される', async () => {
    mockedValidateEmailAddress.mockResolvedValue({
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'UserEmailAddressFormatInvalidError',
    });

    const result = await validateUserInformationRequired({
      userName: null,
      emailAddress: 'invalid-email',
      department: null,
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100,
    });

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe(null);
    expect(result.validatedEmailAddress).toBe(null);
    expect(result.validatedDepartment).toBe(null);
    expect(result.errorCode).toBe('UserNameEmptyError');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.length).toBe(3);

    const errorFields = result.errorDetails?.map(e => e.field) || [];
    expect(errorFields).toContain('userName');
    expect(errorFields).toContain('emailAddress');
    expect(errorFields).toContain('department');

    const errorCodes = result.errorDetails?.map(e => e.errorCode) || [];
    expect(errorCodes).toContain('UserNameEmptyError');
    expect(errorCodes).toContain('UserEmailAddressFormatInvalidError');
    expect(errorCodes).toContain('UserDepartmentEmptyError');
  });
});
