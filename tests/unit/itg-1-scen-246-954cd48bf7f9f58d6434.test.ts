import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  NoActiveReportersError,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterModule from '../../src/logic/reporter-master-management';

describe('SCEN-246: 報告者マスタが空の場合は警告を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoActiveReportersError with correct message when reporter master is empty', async () => {
    // Arrange
    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:05:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    // Mock judgeSchedulerExecutionTiming to return true
    jest
      .spyOn(businessDayModule, 'judgeSchedulerExecutionTiming' as any)
      .mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return empty array
    jest
      .spyOn(reporterModule, 'getActiveReportersForSubmissionCheck' as any)
      .mockResolvedValue([]);

    // Act & Assert
    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow(NoActiveReportersError);

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow('検知対象の有効な報告者が存在しません。');
  });
});
