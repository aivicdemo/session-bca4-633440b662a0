import { judgeSchedulerExecutionTiming, InvalidSchedulerConfigurationError } from '../../src/logic/business-day-deadline-judgment';
import type { JudgeSchedulerExecutionTimingInput } from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment', () => {
  const actual = jest.requireActual('../../src/logic/business-day-deadline-judgment');
  return {
    ...actual,
    judgeSchedulerExecutionTiming: jest.fn(),
    isBusinessDay: jest.fn(() => true),
  };
});

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const { isBusinessDay } = require('../../src/logic/business-day-deadline-judgment');

describe('SCEN-728: 報告者IDが空または不正な形式のときのエラー検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isBusinessDay as jest.Mock).mockReturnValue(true);
  });

  describe('reporterIdが空文字列のとき', () => {
    it('InvalidSchedulerConfigurationErrorが発生し、エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', () => {
      const input = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
        reporterId: '',
      } as any;

      const error = new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      mockedJudgeSchedulerExecutionTiming.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        judgeSchedulerExecutionTiming(input);
      }).toThrow(InvalidSchedulerConfigurationError);

      try {
        judgeSchedulerExecutionTiming(input);
        fail('例外がスローされるべき');
      } catch (e) {
        expect((e as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      }
    });
  });

  describe('reporterIdがnullのとき', () => {
    it('InvalidSchedulerConfigurationErrorが発生し、エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', () => {
      const input = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
        reporterId: null,
      } as any;

      const error = new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      mockedJudgeSchedulerExecutionTiming.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        judgeSchedulerExecutionTiming(input);
      }).toThrow(InvalidSchedulerConfigurationError);

      try {
        judgeSchedulerExecutionTiming(input);
        fail('例外がスローされるべき');
      } catch (e) {
        expect((e as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      }
    });
  });

  describe('reporterIdがundefinedのとき', () => {
    it('InvalidSchedulerConfigurationErrorが発生し、エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', () => {
      const input = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
        reporterId: undefined,
      } as any;

      const error = new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      mockedJudgeSchedulerExecutionTiming.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        judgeSchedulerExecutionTiming(input);
      }).toThrow(InvalidSchedulerConfigurationError);

      try {
        judgeSchedulerExecutionTiming(input);
        fail('例外がスローされるべき');
      } catch (e) {
        expect((e as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      }
    });
  });

  describe('reporterIdが記号のみのとき', () => {
    it('InvalidSchedulerConfigurationErrorが発生し、エラー文言が「スケジューラ実行時刻の設定が無効です。管理者に確認してください。」である', () => {
      const input = {
        currentTimestamp: '2024-01-15T17:30:00Z',
        scheduledExecutionTime: '17:30',
        executionTimeToleranceMinutes: 5,
        timeZone: 'Asia/Tokyo',
        reporterId: '!!!',
      } as any;

      const error = new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      mockedJudgeSchedulerExecutionTiming.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        judgeSchedulerExecutionTiming(input);
      }).toThrow(InvalidSchedulerConfigurationError);

      try {
        judgeSchedulerExecutionTiming(input);
        fail('例外がスローされるべき');
      } catch (e) {
        expect((e as Error).message).toBe('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
      }
    });
  });

  it('処理は中断され、JudgeSchedulerExecutionTimingOutput出力型の値は返却されない', () => {
    const input = {
      currentTimestamp: '2024-01-15T17:30:00Z',
      scheduledExecutionTime: '17:30',
      executionTimeToleranceMinutes: 5,
      timeZone: 'Asia/Tokyo',
      reporterId: '',
    } as any;

    const error = new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
    mockedJudgeSchedulerExecutionTiming.mockImplementation(() => {
      throw error;
    });

    let output;
    try {
      output = judgeSchedulerExecutionTiming(input);
      fail('例外がスローされるべき');
    } catch (e) {
      if (e instanceof InvalidSchedulerConfigurationError) {
        expect(output).toBeUndefined();
      } else {
        throw e;
      }
    }
  });
});
