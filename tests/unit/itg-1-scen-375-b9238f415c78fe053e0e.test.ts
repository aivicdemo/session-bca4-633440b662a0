import { updateReporter, InvalidEmailFormatError } from '../../src/logic/reporter-master-management';
import * as validationModule from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-375: updateReporter with invalid email format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidEmailFormatError when email address format is invalid', async () => {
    const input = {
      reporterId: 'reporter-001',
      emailAddress: 'invalid-email-format',
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    (validationModule.validateEmailAddress as jest.Mock).mockImplementation(() => {
      throw new InvalidEmailFormatError('メールアドレスの形式が正しくありません。');
    });

    await expect(updateReporter(input)).rejects.toThrow(InvalidEmailFormatError);
    await expect(updateReporter(input)).rejects.toThrow('メールアドレスの形式が正しくありません。');
  });
});
