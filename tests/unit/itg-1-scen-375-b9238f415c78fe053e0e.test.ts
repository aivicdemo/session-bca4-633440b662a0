import {
  updateReporter,
  UpdateReporterInput,
  InvalidEmailFormatError,
} from '../../src/logic/reporter-master-management';
import {
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-375: 更新されたメールアドレスが標準的なメール形式に合致しないと、InvalidEmailFormatErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('メールアドレスが無効な形式の場合、InvalidEmailFormatErrorが発生する', () => {
    const reporterId = 'reporter-001';
    const teamLeaderId = 'leader-001';
    const invalidEmail = 'invalid-email-format';
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');

    (validateEmailAddress as jest.Mock).mockImplementation(() => {
      throw new InvalidEmailFormatError('メールアドレスの形式が正しくありません。');
    });

    const input: UpdateReporterInput = {
      reporterId,
      emailAddress: invalidEmail,
      reporterName: undefined,
      department: undefined,
      status: undefined,
      teamLeaderId,
      executionTimestamp,
    };

    expect(() => {
      updateReporter(input);
    }).toThrow(InvalidEmailFormatError);

    expect(() => {
      updateReporter(input);
    }).toThrow('メールアドレスの形式が正しくありません。');
  });
});
