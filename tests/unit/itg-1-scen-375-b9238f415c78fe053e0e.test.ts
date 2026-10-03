import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  updateReporter,
  UpdateReporterInput,
  InvalidEmailFormatError,
} from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/input-validation-formatting');

describe('SCEN-375: 更新されたメールアドレスが標準的なメール形式に合致しないと、InvalidEmailFormatErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新されたメールアドレスが標準的なメール形式に合致しないと、InvalidEmailFormatErrorが発生する', async () => {
    const input: UpdateReporterInput = {
      reporterId: 'reporter-001',
      emailAddress: 'invalid-email-format',
      reporterName: undefined,
      department: undefined,
      status: undefined,
      teamLeaderId: 'leader-001',
      executionTimestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const { validateEmailAddress } = require('../../src/logic/input-validation-formatting');

    validateEmailAddress.mockImplementation(() => {
      throw new InvalidEmailFormatError('メールアドレスの形式が正しくありません。');
    });

    await expect(updateReporter(input)).rejects.toThrow(InvalidEmailFormatError);
    await expect(updateReporter(input)).rejects.toThrow('メールアドレスの形式が正しくありません。');
  });
});
