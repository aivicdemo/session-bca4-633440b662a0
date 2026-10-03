import { describe, it, expect } from '@jest/globals';
import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-155: チームリーダーがメールアドレスが空の状態で検証した場合、メールアドレスを入力してくださいという指定文言でエラーになる', () => {
  it('should return UserEmailAddressEmptyError when emailAddress is null', async () => {
    const input: ValidateUserInformationRequiredInput = {
      userName: '田中太郎',
      emailAddress: null,
      department: '営業部',
    };

    const result: ValidateUserInformationRequiredOutput = await validateUserInformationRequired(input);

    expect(result.isValid).toBe(false);
    expect(result.validatedEmailAddress).toBeNull();
    expect(result.errorCode).toBe('EmailAddressEmpty');
    expect(result.errorDetails).toContainEqual({
      field: 'emailAddress',
      errorCode: 'EmailAddressEmpty',
    });
  });
});
