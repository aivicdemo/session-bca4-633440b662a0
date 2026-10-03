import { describe, it, expect } from '@jest/globals';
import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-149: 複数フィールドで検証失敗が発生した場合', () => {
  it('should return first error code with all error details when multiple fields fail validation', async () => {
    const input = {
      userName: null,
      emailAddress: 'invalid-email',
      department: null,
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.validatedDepartment).toBeNull();
    expect(result.errorCode).toBe('NameEmpty');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toHaveLength(3);
    expect(result.errorDetails).toContainEqual({ field: 'userName', errorCode: 'NameEmpty' });
    expect(result.errorDetails).toContainEqual({ field: 'emailAddress', errorCode: 'EmailAddressInvalidFormat' });
    expect(result.errorDetails).toContainEqual({ field: 'department', errorCode: 'DepartmentEmpty' });
  });
});
