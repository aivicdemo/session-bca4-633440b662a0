import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

describe('SCEN-327: 有効なユーザーID・報告者名・メールアドレスで新規報告者を登録し、成功レスポンスと変更履歴IDを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new reporter with valid inputs and return success response with change history ID', async () => {
    // テスト用の入力値を準備
    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    // validateReporterNameFormat スタブ化
    jest
      .spyOn(inputValidation, 'validateReporterNameFormat')
      .mockResolvedValue({
        isValid: true,
      });

    // validateEmailAddress スタブ化
    jest
      .spyOn(inputValidation, 'validateEmailAddress')
      .mockResolvedValue({
        isValid: true,
      });

    // detectDuplicateEmailAddress スタブ化
    jest
      .spyOn(inputValidation, 'detectDuplicateEmailAddress')
      .mockResolvedValue({
        isDuplicate: false,
      });

    // validateUserAccountActiveStatus スタブ化
    jest
      .spyOn(userAuth, 'validateUserAccountActiveStatus')
      .mockResolvedValue({
        isActive: true,
      });

    // registerReporterToMaster スタブ化
    jest
      .spyOn(userMasterPersistence, 'registerReporterToMaster')
      .mockResolvedValue({
        reporterId: 'RPT-001',
      });

    // persistReporterMasterChangeHistory スタブ化
    jest
      .spyOn(userMasterPersistence, 'persistReporterMasterChangeHistory')
      .mockResolvedValue({
        changeHistoryId: 'CHG-001',
      });

    // registerReporter 関数を呼び出す
    const result = (await registerReporter(input)) as RegisterReporterOutput;

    // 出力を検証
    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toBe('報告者を正常に登録しました');
    expect(result.changeHistoryId).toBe('CHG-001');

    // スタブ関数が期待通りの順序で呼び出されたことを検証
    expect(inputValidation.validateReporterNameFormat).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: '山田太郎',
      })
    );
    expect(inputValidation.validateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'yamada@example.com',
      })
    );
    expect(inputValidation.detectDuplicateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'yamada@example.com',
      })
    );
    expect(userAuth.validateUserAccountActiveStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'U001',
      })
    );
    expect(userMasterPersistence.registerReporterToMaster).toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'CREATE',
        reporterId: 'RPT-001',
        executedBy: 'TL001',
        executedAt: expect.any(Date),
      })
    );
  });
});
