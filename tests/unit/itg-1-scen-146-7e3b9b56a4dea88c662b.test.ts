import { describe, it, expect } from '@jest/globals';
import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
  UserDepartmentEmptyError,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-146: 所属フィールドがnull・undefined・空白のみの場合、UserDepartmentEmptyErrorが発生して所属の確定値がnullになる', () => {
  it('所属フィールドがnullで呼び出された場合、UserDepartmentEmptyErrorが発生し、isValidがfalse、validatedDepartmentがnullになる', async () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: 'tanaka@example.com',
      department: null,
    };

    const result: ValidateUserInformationRequiredOutput = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedDepartment).toBe(null);
    expect(result.validatedUserName).toBe('田中太郎');
    expect(result.validatedEmailAddress).toBe('tanaka@example.com');
    expect(result.errorCode).toBe('UserDepartmentEmptyError');
    expect(result.errorDetails).toContainEqual({
      field: 'department',
      errorCode: 'UserDepartmentEmptyError',
    });
  });
});
