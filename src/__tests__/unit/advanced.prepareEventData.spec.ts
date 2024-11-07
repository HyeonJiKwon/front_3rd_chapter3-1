import { describe, it, expect } from 'vitest';

import { Event, EventForm, RepeatInfo } from '../../types';
import { prepareEventData } from '../../utils/prepareEventData';

describe('prepareEventData util 함수 테스트', () => {
  it('새로운 이벤트를 생성할 때 올바르게 데이터를 준비해야 한다.', () => {
    const params = {
      editingEvent: null,
      title: '새로운 이벤트',
      date: '2024-10-10',
      startTime: '09:00',
      endTime: '10:00',
      description: '이벤트 설명',
      location: '회의실 A',
      category: '회의',
      isRepeating: false,
      repeatType: 'daily' as RepeatInfo['type'], // 사용되지 않아도 타입 일치
      repeatInterval: 1,
      notificationTime: 30,
    };

    const expected: EventForm = {
      title: '새로운 이벤트',
      date: '2024-10-10',
      startTime: '09:00',
      endTime: '10:00',
      description: '이벤트 설명',
      location: '회의실 A',
      category: '회의',
      repeat: {
        type: 'none',
        interval: 1,
        endDate: undefined,
      },
      notificationTime: 30,
    };

    const result = prepareEventData(params);
    expect(result).toEqual(expected);
  });

  it('기존 이벤트를 편집할 때 올바르게 데이터를 준비해야 한다.', () => {
    const existingEvent: Event = {
      id: '123',
      title: '기존 이벤트',
      date: '2024-10-05',
      startTime: '14:00',
      endTime: '15:00',
      description: '기존 이벤트 설명',
      location: '회의실 B',
      category: '워크샵',
      repeat: {
        type: 'weekly',
        interval: 2,
        endDate: '2024-12-31',
      },
      notificationTime: 15,
    };

    const params = {
      editingEvent: existingEvent,
      title: '수정된 이벤트',
      date: '2024-10-06',
      startTime: '16:00',
      endTime: '17:00',
      description: '수정된 설명',
      location: '회의실 C',
      category: '교육',
      isRepeating: true,
      repeatType: 'monthly' as RepeatInfo['type'],
      repeatInterval: 1,
      repeatEndDate: '2025-01-31',
      notificationTime: 45,
    };

    const expected: Event = {
      id: '123',
      title: '수정된 이벤트',
      date: '2024-10-06',
      startTime: '16:00',
      endTime: '17:00',
      description: '수정된 설명',
      location: '회의실 C',
      category: '교육',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-01-31',
      },
      notificationTime: 45,
    };

    const result = prepareEventData(params);
    expect(result).toEqual(expected);
  });

  it('반복 설정(repeatType)이 없는 경우 "none"으로 설정되어야 한다.', () => {
    const params = {
      editingEvent: null,
      title: '비반복 이벤트',
      date: '2024-10-15',
      startTime: '11:00',
      endTime: '12:00',
      description: '비반복 설명',
      location: '회의실 D',
      category: '회의',
      isRepeating: false,
      repeatType: 'daily' as RepeatInfo['type'], // 사용되지 않음
      repeatInterval: 1,
      notificationTime: 20,
    };

    const expected: EventForm = {
      title: '비반복 이벤트',
      date: '2024-10-15',
      startTime: '11:00',
      endTime: '12:00',
      description: '비반복 설명',
      location: '회의실 D',
      category: '회의',
      repeat: {
        type: 'none',
        interval: 1,
        endDate: undefined,
      },
      notificationTime: 20,
    };

    const result = prepareEventData(params);
    expect(result).toEqual(expected);
  });

  it('반복 설정(repeatType)이 있는 경우 올바르게 설정되어야 한다.', () => {
    const params = {
      editingEvent: null,
      title: '반복 이벤트',
      date: '2024-10-20',
      startTime: '13:00',
      endTime: '14:00',
      description: '반복 설명',
      location: '회의실 E',
      category: '세미나',
      isRepeating: true,
      repeatType: 'daily' as RepeatInfo['type'],
      repeatInterval: 3,
      repeatEndDate: '2024-11-20',
      notificationTime: 10,
    };

    const expected: EventForm = {
      title: '반복 이벤트',
      date: '2024-10-20',
      startTime: '13:00',
      endTime: '14:00',
      description: '반복 설명',
      location: '회의실 E',
      category: '세미나',
      repeat: {
        type: 'daily',
        interval: 3,
        endDate: '2024-11-20',
      },
      notificationTime: 10,
    };

    const result = prepareEventData(params);
    expect(result).toEqual(expected);
  });

  it('반복 종료일이 없는 경우 undefined로 설정되어야 한다.', () => {
    const params = {
      editingEvent: null,
      title: '무기한 반복 이벤트',
      date: '2024-10-25',
      startTime: '15:00',
      endTime: '16:00',
      description: '무기한 반복 설명',
      location: '회의실 F',
      category: '워크숍',
      isRepeating: true,
      repeatType: 'weekly' as RepeatInfo['type'],
      repeatInterval: 1,
      notificationTime: 5,
    };

    const expected: EventForm = {
      title: '무기한 반복 이벤트',
      date: '2024-10-25',
      startTime: '15:00',
      endTime: '16:00',
      description: '무기한 반복 설명',
      location: '회의실 F',
      category: '워크숍',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: undefined,
      },
      notificationTime: 5,
    };

    const result = prepareEventData(params);
    expect(result).toEqual(expected);
  });

  it('반복 타입이 "none"인 경우 interval과 endDate가 기본값으로 설정되어야 한다.', () => {
    const params = {
      editingEvent: null,
      title: '비반복 이벤트',
      date: '2024-11-05',
      startTime: '08:00',
      endTime: '09:00',
      description: '비반복 설명',
      location: '회의실 H',
      category: '회의',
      isRepeating: false,
      repeatType: 'daily' as RepeatInfo['type'], // 사용되지 않음
      repeatInterval: 5,
      repeatEndDate: '2024-12-05',
      notificationTime: 60,
    };

    const expected: EventForm = {
      title: '비반복 이벤트',
      date: '2024-11-05',
      startTime: '08:00',
      endTime: '09:00',
      description: '비반복 설명',
      location: '회의실 H',
      category: '회의',
      repeat: {
        type: 'none',
        interval: 1,
        endDate: undefined,
      },
      notificationTime: 60,
    };

    const result = prepareEventData(params);
    expect(result).toEqual(expected);
  });
});
