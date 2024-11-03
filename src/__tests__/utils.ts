import { RepeatInfo, RepeatType, Event } from '../types';
import { fillZero } from '../utils/dateUtils';

export const assertDate = (date1: Date, date2: Date) => {
  expect(date1.toISOString()).toBe(date2.toISOString());
};

export const parseHM = (timestamp: number) => {
  const date = new Date(timestamp);
  const h = fillZero(date.getHours());
  const m = fillZero(date.getMinutes());
  return `${h}:${m}`;
};

/**
 * 기본 RepeatInfo 객체
 */
export const defaultRepeatInfo = (repeatType: RepeatType = 'none'): RepeatInfo => {
  return {
    type: repeatType,
    interval: 1,
  };
};

/**
 * 기본 Event 객체
 */
export const createMockEvent = (overrides?: Partial<Event>): Event => {
  return {
    id: 'default-id',
    title: 'Default Event',
    date: '2024-01-01',
    startTime: '09:00',
    endTime: '10:00',
    description: 'Default Description',
    location: 'Default Location',
    category: 'Default Category',
    repeat: defaultRepeatInfo(),
    notificationTime: 30, // 30분 전
    ...overrides,
  };
};
