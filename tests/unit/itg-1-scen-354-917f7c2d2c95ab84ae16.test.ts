import { registerReporter, InvalidReporterNameFormat } from '../../src/logic/reporter-master-management';

describe('SCEN-354: 報告者名が空の場合、br-tx_7-004の制約2により「報告者名は必須です」エラーメッセージが返される', () => {
  it('reporterNameフィールドに空文字列を設定した場合、success=false、reporterId=null、message=\"報告者名は必須です\"、changeHistoryId=nullが返され、InvalidReporterNameFormatエラーが発生する', async () => {
    const input = {
      userId: 'U001',
      reporterName: '',
      emailAddress: 'reporter@example.com',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00+09:00'),
    };

    try {
      const result = await registerReporter(input);
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toBe('報告者名は必須です');
      expect(result.changeHistoryId).toBeNull();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidReporterNameFormat);
    }
  });
});
