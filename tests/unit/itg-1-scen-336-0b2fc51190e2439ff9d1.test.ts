jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter, RegistrationFailed } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-336: データベースへの保存処理に失敗した場合、RegistrationFailedエラーを返す', () => {
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
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockRejectedValue(new RegistrationFailed('Database save error'));
  });

  it('データベース保存失敗時、success=false、reporterId=null、適切なmessageとchangeHistoryId=nullを返す', async () => {
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
    expect(result.message).toBe('報告者の登録に失敗しました。システム管理者に連絡してください。');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
