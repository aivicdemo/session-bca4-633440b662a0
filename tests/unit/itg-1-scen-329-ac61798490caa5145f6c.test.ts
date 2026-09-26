import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-329: 報告者名が1文字未満または100文字を超える場合、InvalidReporterNameFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidReporterNameFormat error when reporter name is empty string (test case 1)', async () => {
    (inputValidation.validateReporterNameFormat as any).mockRejectedValue(
      new InvalidReporterNameFormat(
        '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
      )
    );

    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: '',
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader-id',
      executionTimestamp: now,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('should return InvalidReporterNameFormat error when reporter name exceeds 100 characters (test case 2)', async () => {
    (inputValidation.validateReporterNameFormat as any).mockRejectedValue(
      new InvalidReporterNameFormat(
        '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
      )
    );

    const now = new Date();
    const longName = '1234567890'.repeat(11);
    const input: RegisterReporterInput = {
      userId: 'valid-user-id',
      reporterName: longName,
      emailAddress: 'test@example.com',
      teamLeaderId: 'leader-id',
      executionTimestamp: now,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
