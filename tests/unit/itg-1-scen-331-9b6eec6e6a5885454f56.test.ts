jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');
jest.mock('../../src/logic/user-authentication-authorization');

import {
  registerReporter,
  InvalidEmailAddressFormat,
  type RegisterReporterInput,
  type RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  registerReporterToMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';
import {
  validateUserAccountActiveStatus,
} from '../../src/logic/user-authentication-authorization';

const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-331: メールアドレスが空文字列の場合、InvalidEmailAddressFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 4. スタブ validateUserAccountActiveStatus を 'valid' を返すようセットアップして、userId が有効であることを前提とする
    mockedValidateUserAccountActiveStatus.mockReturnValue({ isValid: true });

    // 5. スタブ validateReporterNameFormat を成功（有効）を返すようセットアップして、reporterName が形式要件を満たしていることを前提とする
    mockedValidateReporterNameFormat.mockReturnValue({ isValid: true });
  });

  it('メールアドレスが空文字列の場合、InvalidEmailAddressFormatエラーを返す', () => {
    // 1. テスト対象関数 registerReporter を呼び出す準備として、RegisterReporterInput 型の入力値を構築する
    // 2. RegisterReporterInput の emailAddress フィールドに空文字列 '' を設定する
    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '有効な報告者名',
      emailAddress: '',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date('2026-09-24T10:00:00Z'),
    };

    // 3. その他の必須フィールド（userId、reporterName、teamLeaderId、executionTimestamp）には有効な値を設定する（上記で設定済み）

    // 6. registerReporter(input) を同期呼び出しする
    const result: RegisterReporterOutput = registerReporter(input);

    // 7. 返却された RegisterReporterOutput 型の出力値を検証する
    // 期待結果: registerReporter 関数は InvalidEmailAddressFormat エラーを発生させ、以下の状態の RegisterReporterOutput を返す
    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      'メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    // validateEmailAddress、detectDuplicateEmailAddress、registerReporterToMaster、
    // persistReporterMasterChangeHistoryは呼び出されない
    expect(mockedValidateEmailAddress).not.toHaveBeenCalled();
    expect(mockedDetectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
