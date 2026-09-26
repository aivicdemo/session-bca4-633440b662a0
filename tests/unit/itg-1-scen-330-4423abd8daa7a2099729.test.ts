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

describe('SCEN-330: 報告者名に許可されていない文字が含まれている場合、InvalidReporterNameFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidReporterNameFormat error when reporter name contains forbidden characters', async () => {
    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '田中@太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: now,
    };

    (inputValidation.validateReporterNameFormat as any).mockRejectedValue(
      new InvalidReporterNameFormat(
        '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
      )
    );

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
