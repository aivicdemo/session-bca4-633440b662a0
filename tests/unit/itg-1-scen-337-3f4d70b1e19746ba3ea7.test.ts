jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, UserNotFoundInUserMaster } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-337: ユーザーマスタが空の場合、br-tx_3-004の制約1により「対象者が登録されていません」エラーで処理が中断される', () => {
  const userId = 'U001';
  const reporterName = '山田太郎';
  const emailAddress = 'yamada@example.com';
  const teamLeaderId = 'TL001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue(false);
    mockedValidateUserAccountActiveStatus.mockRejectedValue(
      new Error('対象者が登録されていません。ユーザーマスタを設定してください')
    );
  });

  it('ユーザーマスタが空の場合、success=false、reporterId=null、br-tx_3-004の制約文言をmessageに返す', async () => {
    const input = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('対象者が登録されていません。ユーザーマスタを設定してください');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).not.toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
