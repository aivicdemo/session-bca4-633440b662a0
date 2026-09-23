import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidReporterNameFormat,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
  validateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  validateUserAccountActiveStatus,
} from '../../src/logic/user-authentication-authorization';

// 依存先のモック
jest.mock('../../src/logic/input-validation-formatting.ts');
jest.mock('../../src/logic/user-authentication-authorization.ts');
jest.mock('../../src/logic/user-master-persistence.ts');

describe('SCEN-354: 報告者名が空の場合、br-tx_7-004の制約2により「報告者名は必須です」エラーメッセージが返される', () => {
  let mockValidateReporterNameFormat: jest.Mock;
  let mockValidateEmailAddress: jest.Mock;
  let mockValidateUserAccountActiveStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
    mockValidateEmailAddress = validateEmailAddress as jest.Mock;
    mockValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;

    // validateUserAccountActiveStatus は成功するように設定
    // @ts-ignore
    mockValidateUserAccountActiveStatus.mockResolvedValue({
      isActive: true,
    });

    // validateEmailAddress は成功するように設定
    // @ts-ignore
    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
    });

    // validateReporterNameFormat は空文字列を検出してエラーを発生させるように設定
    // @ts-ignore
    mockValidateReporterNameFormat.mockImplementation(async () => {
      throw new InvalidReporterNameFormat('報告者名は必須です');
    });
  });

  it('報告者名が空文字列の場合、InvalidReporterNameFormatエラーが発生し、success=false、reporterId=null、message=\"報告者名は必須です\"が返される', async () => {
    // 入力値を構築
    const input: RegisterReporterInput = {
      userId: 'USER-001',
      reporterName: '', // 空文字列
      emailAddress: 'test@example.com',
      teamLeaderId: 'LEADER-001',
      executionTimestamp: new Date(),
    };

    // 実行
    // @ts-ignore
    const result: RegisterReporterOutput = await registerReporter(input);

    // 戻り値を検証
    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toBe('報告者名は必須です');
    expect(result.changeHistoryId).toBe(null);
  });
});
