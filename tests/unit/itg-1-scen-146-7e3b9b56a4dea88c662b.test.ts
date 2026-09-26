import {
  validateUserInformationRequired,
} from '../../src/logic/input-validation-formatting';
import type {
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-146: 所属フィールドがnull・undefined・空白のみの場合、UserDepartmentEmptyErrorが発生して所属の確定値がnullになる', () => {
  test('所属がnullで、メールアドレスと名前が有効な場合、UserDepartmentEmptyErrorエラーが発生してisValidがfalse、validatedDepartmentがnullになる', () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: null,
    };

    const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedDepartment).toBeNull();
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');
    expect(result.errorCode).toBe('DepartmentEmpty');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'DepartmentEmpty',
    });
  });
});
