import { describe, it, expect } from '@jest/globals';
import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-156: チームリーダーが所属が空の状態で検証した場合、所属を選択してくださいという指定文言でエラーになる', () => {
  it('should return UserDepartmentEmptyError when department is null', async () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'taro@example.com',
      department: null,
    };

    const result: ValidateUserInformationRequiredOutput = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('taro@example.com');
    expect(result.validatedDepartment).toBeNull();
    expect(result.errorCode).toBe('DepartmentEmpty');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'DepartmentEmpty',
    });
  });
});
