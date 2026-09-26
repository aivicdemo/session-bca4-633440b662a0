import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-327: 有効なユーザーID・報告者名・メールアドレスで新規報告者を登録し、成功レスポンスと変更履歴IDを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new reporter with valid inputs and return success response with change history ID', async () => {
    const now = new Date();
    const input: RegisterReporterInput = {
      userId: 'U001',
      reporterName: '山田太郎',
      emailAddress: 'yamada@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: now,
    };

    (inputValidation.validateReporterNameFormat as any).mockResolvedValue({
      isValid: true,
      validatedReporterName: '山田太郎',
      errorCode: null,
    });

    (inputValidation.validateEmailAddress as any).mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    (inputValidation.detectDuplicateEmailAddress as any).mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'yamada@example.com',
      errorCode: null,
    });

    (userAuth.validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: true,
      userId: 'U001',
      inactiveReason: null,
    });

    (userMasterPersistence.registerReporterToMaster as any).mockResolvedValue({
      success: true,
      reporterId: 'RPT-001',
      message: '報告者が登録されました',
    });

    (userMasterPersistence.persistReporterMasterChangeHistory as any).mockResolvedValue({
      success: true,
      changeHistoryId: 'CHG-001',
      message: '変更履歴が記録されました',
    });

    const result: RegisterReporterOutput = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('RPT-001');
    expect(result.message).toBe('報告者を正常に登録しました');
    expect(result.changeHistoryId).toBe('CHG-001');

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
        operationType: 'register',
        reporterId: 'RPT-001',
        leaderUserId: 'TL001',
        operationTimestamp: now,
      })
    );
  });
});
