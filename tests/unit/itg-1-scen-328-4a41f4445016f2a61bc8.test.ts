import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

describe('SCEN-328: 報告者名が空文字列の場合、InvalidReporterNameFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidReporterNameFormat error when reporter name is empty string', async () => {
    // 入力型 RegisterReporterInput を構築
    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '',
      emailAddress: 'test@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: now,
    };

    // validateReporterNameFormat スタブ化
    jest
      .spyOn(inputValidation, 'validateReporterNameFormat')
      .mockImplementation(() => {
        throw new InvalidReporterNameFormat(
          '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
        );
      });

    // registerReporter 関数を呼び出す
    const result = (await registerReporter(input)) as RegisterReporterOutput;

    // 戻り値 RegisterReporterOutput を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.changeHistoryId).toBeNull();
    expect(result.message).toContain(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );

    // registerReporterToMaster および persistReporterMasterChangeHistory の呼び出しは行われないことを確認
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
