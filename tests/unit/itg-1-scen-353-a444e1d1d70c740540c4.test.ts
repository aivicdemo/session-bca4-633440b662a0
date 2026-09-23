import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';
import {
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  validateUserAccountActiveStatus,
} from '../../src/logic/user-authentication-authorization';

// 依存先のモック
jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-353: メールアドレスが空または形式が不正な場合、br-tx_7-004の制約1により「有効なメールアドレスを入力してください」エラーメッセージが返される', () => {
  let mockValidateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateEmailAddress = validateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;

    // validateUserAccountActiveStatus は成功するように設定
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
    });

    // validateEmailAddress は空文字列を検出してエラーを発生させるように設定
    // @ts-ignore
    mockValidateEmailAddress.mockImplementation(async () => {
      throw new InvalidEmailAddressFormat('有効なメールアドレスを入力してください');
    });
  });

  it('メールアドレスが空文字列の場合、InvalidEmailAddressFormatエラーが発生し、success=false、reporterId=null、message=\"有効なメールアドレスを入力してください\"が返される', async () => {
    // 入力値を構築
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '山田太郎',
      emailAddress: '', // 空文字列
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toBe('有効なメールアドレスを入力してください');
    expect(result.changeHistoryId).toBe(null);
  });
});
