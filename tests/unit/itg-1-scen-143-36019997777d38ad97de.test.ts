import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

describe('SCEN-143: 名前フィールドがnull・undefined・空白のみの場合、UserNameEmptyErrorが発生して名前の確定値がnullになる', () => {
  const testCases = [
    { userName: null, description: 'null' },
    { userName: undefined, description: 'undefined' },
    { userName: '', description: 'empty string' },
    { userName: '   ', description: 'whitespace only' },
  ];

  testCases.forEach(({ userName, description }) => {
    test(`${description}を入力した場合、UserNameEmptyErrorが発生して名前の確定値がnullになる`, async () => {
      const input: ValidateUserInformationRequiredInput = {
        userName,
        emailAddress: 'user@example.com',
        department: '営業部',
      };

      const result = await validateUserInformationRequired(input);

      expect(result.isValid).toBe(false);
      expect(result.validatedUserName).toBeNull();
      expect(result.errorCode).toBe('UserNameEmptyError');
    });
  });
});
