import { describe, it, expect } from '@jest/globals';
import { validateUserInformationRequired } from '../../src/logic/input-validation-formatting';

describe('SCEN-147: 名前の文字数が指定された最大許容文字数を超える場合', () => {
  it('should return UserNameFormatInvalidError when userName exceeds maximum length', async () => {
    const input = {
      userName: 'あ'.repeat(101),
      emailAddress: 'user@example.com',
      department: '営業部',
      maximumUserNameLength: 100
    };

    const result = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBeNull();
    expect(result.errorCode).toBe('NameInvalidFormat');
    expect(result.validatedEmailAddress).toBe('user@example.com');
    expect(result.validatedDepartment).toBe('営業部');
  });
});
