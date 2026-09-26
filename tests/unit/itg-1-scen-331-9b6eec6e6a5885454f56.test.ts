import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  registerReporter,
  RegisterReporterInput,
  RegisterReporterOutput,
  InvalidEmailAddressFormat,
} from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as userAuth from '../../src/logic/user-authentication-authorization';
import * as userMasterPersistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-331: メールアドレスが空文字列の場合、InvalidEmailAddressFormatエラーを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return InvalidEmailAddressFormat error when email address is empty string', async () => {
    (inputValidation.validateReporterNameFormat as any).mockResolvedValue({
      isValid: true,
      validatedReporterName: '有効な報告者名',
      errorCode: null,
    });

    (userAuth.validateUserAccountActiveStatus as any).mockResolvedValue({
      isActive: true,
      userId: 'USER001',
      inactiveReason: null,
    });

    (inputValidation.validateEmailAddress as any).mockRejectedValue(
      new InvalidEmailAddressFormat(
        'メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。'
      )
    );

    const input: RegisterReporterInput = {
      userId: 'USER001',
      reporterName: '有効な報告者名',
      emailAddress: '',
      teamLeaderId: 'LEADER001',
      executionTimestamp: new Date('2026-09-24T10:00:00Z'),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe(
      'メールアドレスは必須項目で、有効なメールアドレス形式で入力してください。'
    );
    expect(result.changeHistoryId).toBeNull();

    expect(inputValidation.detectDuplicateEmailAddress).not.toHaveBeenCalled();
    expect(userMasterPersistence.registerReporterToMaster).not.toHaveBeenCalled();
    expect(userMasterPersistence.persistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
