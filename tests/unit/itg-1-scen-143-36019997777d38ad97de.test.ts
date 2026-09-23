import {
  validateUserInformationRequired,
  ValidateUserInformationRequiredInput,
  ValidateUserInformationRequiredOutput,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting', () => {
  const actual = jest.requireActual('../../src/logic/input-validation-formatting');
  return {
    ...actual,
    validateEmailAddress: jest.fn((input) => ({
      isValid: true,
      validatedEmailAddress: input.emailAddress,
      errorCode: null,
    })),
  };
});

describe('SCEN-143: 名前フィールドがnull・undefined・空白のみの場合、UserNameEmptyErrorが発生して名前の確定値がnullになる', () => {
  const testCases = [
    { userName: null, description: 'null' },
    { userName: undefined, description: 'undefined' },
    { userName: '', description: 'empty string' },
    { userName: '   ', description: 'whitespace only' },
  ];

  testCases.forEach(({ userName, description }) => {
    test(`should return UserNameEmptyError when userName is ${description}`, () => {
      const input: ValidateUserInformationRequiredInput = {
        userName,
        emailAddress: 'user@example.com',
        department: '営業部',
      };

      const result: ValidateUserInformationRequiredOutput = validateUserInformationRequired(input);

      expect(result.isValid).toBe(false);
      expect(result.validatedUserName).toBeNull();
      expect(result.errorCode).toBe('UserNameEmptyError');
    });
  });
});
