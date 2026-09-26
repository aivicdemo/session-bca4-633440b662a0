import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, InvalidReporterNameFormat } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.MockedFunction<any>;
const mockedValidateEmailAddress = validateEmailAddress as jest.MockedFunction<any>;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.MockedFunction<any>;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.MockedFunction<any>;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.MockedFunction<any>;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.MockedFunction<any>;

describe('SCEN-348: 報告者名が空の場合、br-tx_7-003の制約1により「氏名は必須です」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reporterName=空文字列の場合、InvalidReporterNameFormatエラーが発生し、エラーメッセージが返される', async () => {
    mockedValidateReporterNameFormat.mockRejectedValue(
      new InvalidReporterNameFormat('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。')
    );

    const input = {
      userId: 'USER001',
      reporterName: '',
      emailAddress: 'reporter@example.com',
      teamLeaderId: 'LEAD001',
      executionTimestamp: new Date(),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('報告者名は必須項目で、1文字以上100文字以下の日本語または英数字で入力してください。');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
