import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
  ReporterNotFoundError,
} from '../../src/logic/reporter-master-management';
import {
  retrieveReporterByUserId,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-373: 指定された報告者IDが存在しないと、ReporterNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('報告者IDが報告者マスタに存在しない場合、ReporterNotFoundErrorが発生する', () => {
    const reporterId = 'reporter-999';
    const teamLeaderId = 'leader-001';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (retrieveReporterByUserId as jest.Mock).mockReturnValue(null);

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: '新しい名前',
      emailAddress: 'newemail@example.com',
      department: '営業部',
      status: 'active',
      teamLeaderId,
      executionTimestamp,
    };

    expect(() => {
      updateReporter(input);
    }).toThrow(ReporterNotFoundError);

    expect(() => {
      updateReporter(input);
    }).toThrow(/指定された報告者が見つかりません/);
  });
});
