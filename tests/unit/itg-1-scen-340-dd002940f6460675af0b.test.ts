jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-340: 新入社員配属で既存報告者IDがない場合、br-tx_7-002により登録操作が決定される', () => {
  const userId = 'USER-001';
  const reporterName = '山田太郎';
  const emailAddress = 'yamada.taro@company.example.com';
  const teamLeaderId = 'TL-001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue(false);
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockResolvedValue({ reporterId: 'REPORTER-001' });
    mockedPersistReporterMasterChangeHistory.mockResolvedValue({ changeHistoryId: 'HISTORY-001' });
  });

  it('新入社員配属で既存reporterIdがない場合、登録が正常に完了し、success=true、reporterId=REPORTER-001、changeHistoryId=HISTORY-001を返す', async () => {
    const input = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('REPORTER-001');
    expect(result.message).toBe('報告者を正常に登録しました。');
    expect(result.changeHistoryId).toBe('HISTORY-001');
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
