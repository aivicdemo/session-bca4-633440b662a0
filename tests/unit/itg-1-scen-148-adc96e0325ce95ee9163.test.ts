import { describe, it, expect } from '@jest/globals';
import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-148: 所属の文字数が指定された最大許容文字数を超える場合', () => {
  it('should return appropriate error when department exceeds maximum length', async () => {
    const input = {
      userName: '太郎',
      emailAddress: 'taro@example.com',
      department: 'a'.repeat(101),
      maximumUserNameLength: 100,
      maximumDepartmentLength: 100
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('太郎');
    expect(result.validatedEmailAddress).toBe('taro@example.com');
    expect(result.validatedDepartment).toBeNull();
    expect(result.errorCode).toBe('DepartmentInvalidFormat');
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails).toContainEqual({ field: 'department', errorCode: 'DepartmentInvalidFormat' });
  });
});
