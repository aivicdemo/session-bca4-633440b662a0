import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

describe('SCEN-330: 報告者名に許可されていない文字が含まれている場合、InvalidReporterNameFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidReporterNameFormat error when reporter name contains forbidden characters', async () => {
    // registerReporter関数に以下の入力値を設定
    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '田中@太郎',
      emailAddress: 'tanaka@example.com',
      teamLeaderId: 'LEADER001',
      executionTimestamp: now,
    };

    // validateReporterNameFormat関数をスタブ化
    jest
      .spyOn(inputValidation, 'validateReporterNameFormat')
      .mockImplementation(() => {
        throw new InvalidReporterNameFormat(
          '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
        );
      });

    // registerReporter関数を呼び出す
    const result = (await registerReporter(input)) as RegisterReporterOutput;

    // 戻り値のsuccessフィールドがfalseであることを確認
    expect(result.success).toBe(false);

    // 戻り値のreporterIdフィールドがnullであることを確認
    expect(result.reporterId).toBeNull();

    // 戻り値のmessageフィールドが設計済みエラー文言に一致することを確認
    expect(result.message).toBe(
      '報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。'
    );

    // 戻り値のchangeHistoryIdフィールドがnullであることを確認
    expect(result.changeHistoryId).toBeNull();

    // registerReporterToMaster および persistReporterMasterChangeHistory の呼び出しは行われないことを確認
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
