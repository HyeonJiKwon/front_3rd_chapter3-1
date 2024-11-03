import { Event } from '../../types';
import {
  convertEventToDateRange,
  findOverlappingEvents,
  isOverlapping,
  parseDateTime,
} from '../../utils/eventOverlap';
import { createMockEvent } from '../utils';

describe('parseDateTime', () => {
  it('2024-07-01 14:30을 정확한 Date 객체로 변환한다', () => {
    const date = '2024-07-01';
    const time = '14:30';
    const result = parseDateTime(date, time);
    expect(result).toEqual(new Date('2024-07-01T14:30'));
  });

  it('잘못된 날짜 형식에 대해 Invalid Date를 반환한다', () => {
    const date = '2024-13-01'; // 잘못된 월
    const time = '14:30';
    const result = parseDateTime(date, time);
    expect(result.toString()).toBe('Invalid Date');
  });

  it('잘못된 시간 형식에 대해 Invalid Date를 반환한다', () => {
    const date = '2024-07-01';
    const time = '25:00'; // 잘못된 시간
    const result = parseDateTime(date, time);
    expect(result.toString()).toBe('Invalid Date');
  });

  it('날짜 문자열이 비어있을 때 Invalid Date를 반환한다', () => {
    const date = '';
    const time = '14:30';
    const result = parseDateTime(date, time);
    expect(result.toString()).toBe('Invalid Date');
  });
});

describe('convertEventToDateRange', () => {
  it('일반적인 이벤트를 올바른 시작 및 종료 시간을 가진 객체로 변환한다', () => {
    const event: Event = createMockEvent({
      date: '2024-11-03',
      startTime: '10:00',
      endTime: '12:00',
    });

    const result = convertEventToDateRange(event);
    expect(result).toEqual({
      start: new Date('2024-11-03T10:00'),
      end: new Date('2024-11-03T12:00'),
    });
  });

  it('잘못된 날짜 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const event: Event = createMockEvent({
      date: '2024-13-03', // 잘못된 월
      startTime: '10:00',
      endTime: '12:00',
    });

    const result = convertEventToDateRange(event);
    expect(result).toEqual({
      start: new Date('Invalid Date'),
      end: new Date('Invalid Date'),
    });
  });

  it('잘못된 시간 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const event: Event = createMockEvent({
      date: '2024-11-03',
      startTime: '25:00', // 잘못된 시간
      endTime: '12:00',
    });

    const result = convertEventToDateRange(event);
    expect(result).toEqual({
      start: new Date('Invalid Date'),
      end: new Date('2024-11-03T12:00'),
    });
  });
});

describe('isOverlapping', () => {
  it('두 이벤트가 겹치는 경우 true를 반환한다', () => {
    const event1: Event = createMockEvent({
      id: '1',
      date: '2024-11-03',
      startTime: '10:00',
      endTime: '12:00',
    });

    const event2: Event = createMockEvent({
      id: '2',
      date: '2024-11-03',
      startTime: '11:00',
      endTime: '13:00',
    });

    const result = isOverlapping(event1, event2);
    expect(result).toBe(true);
  });

  it('두 이벤트가 겹치지 않는 경우 false를 반환한다', () => {
    const event1: Event = createMockEvent({
      id: '1',
      date: '2024-11-03',
      startTime: '10:00',
      endTime: '12:00',
    });

    const event2: Event = createMockEvent({
      id: '2',
      date: '2024-11-03',
      startTime: '12:00',
      endTime: '14:00',
    });

    const result = isOverlapping(event1, event2);
    expect(result).toBe(false);
  });
});

describe('findOverlappingEvents', () => {
  const existingEvents: Event[] = [
    createMockEvent({
      id: '1',
      date: '2024-11-03',
      startTime: '09:00',
      endTime: '11:00',
      title: 'Morning Meeting',
    }),
    createMockEvent({
      id: '2',
      date: '2024-11-03',
      startTime: '10:30',
      endTime: '12:30',
      title: 'Project Discussion',
    }),
    createMockEvent({
      id: '3',
      date: '2024-11-03',
      startTime: '13:00',
      endTime: '14:00',
      title: 'Lunch with Team',
    }),
  ];

  it('새 이벤트와 겹치는 모든 이벤트를 반환한다', () => {
    const newEvent: Event = createMockEvent({
      id: '4',
      date: '2024-11-03',
      startTime: '10:00',
      endTime: '11:30',
      title: 'Client Call',
    });

    const overlappingEvents = findOverlappingEvents(newEvent, existingEvents);
    expect(overlappingEvents).toMatchObject([
      {
        id: '1',
        date: '2024-11-03',
        title: 'Morning Meeting',
        startTime: '09:00',
        endTime: '11:00',
      },
      {
        id: '2',
        date: '2024-11-03',
        title: 'Project Discussion',
        startTime: '10:30',
        endTime: '12:30',
      },
    ]);
  });

  it('겹치는 이벤트가 없으면 빈 배열을 반환한다', () => {
    const newEvent: Event = createMockEvent({
      id: '4',
      date: '2024-11-03',
      startTime: '14:00',
      endTime: '15:00',
      title: 'Evening Review',
    });

    const overlappingEvents = findOverlappingEvents(newEvent, existingEvents);
    expect(overlappingEvents).toEqual([]);
  });
});
