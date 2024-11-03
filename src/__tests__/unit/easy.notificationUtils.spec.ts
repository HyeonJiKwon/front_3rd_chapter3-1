import { Event } from '../../types';
import { createNotificationMessage, getUpcomingEvents } from '../../utils/notificationUtils';
import { createMockEvent } from '../utils';

describe('getUpcomingEvents', () => {
  // 고정된 현재 시간 설정
  const fixedNow = new Date('2024-11-03T12:00:00');

  const events: Event[] = [
    createMockEvent({
      id: '1',
      title: '회의',
      date: '2024-11-03',
      startTime: '12:15', // 15분 후
      endTime: '13:15',
      notificationTime: 15, // 12:00(현재) 알림
    }),
    createMockEvent({
      id: '2',
      title: '점심 식사',
      date: '2024-11-03',
      endTime: '13:15',
      startTime: '12:30', // 30분 후
      notificationTime: 15, // 12:15 알림
    }),
    createMockEvent({
      id: '3',
      title: '이벤트',
      date: '2024-11-03',
      endTime: '13:15',
      startTime: '11:50', // 10분 전
      notificationTime: 15, // 11:35 알림
    }),
    createMockEvent({
      id: '4',
      title: '오후 회의',
      date: '2024-11-03',
      startTime: '12:05', // 5분 후
      endTime: '13:15',
      notificationTime: 10, // 11:55 알림
    }),
  ];

  it('알림 시간이 정확히 도래한 이벤트를 반환한다', () => {
    const notifiedEvents: string[] = ['4'];
    // 이벤트 1: 12:15 시작, notificationTime: 15분 → 15분 후
    const result = getUpcomingEvents(events, fixedNow, notifiedEvents);
    expect(result).toEqual([events[0]]);
  });

  it('이미 알림이 간 이벤트는 제외한다', () => {
    // 이벤트 3,4은 이미 알림이 간 상태 + 1도 알림발송 완료?
    const notifiedEvents: string[] = ['1', '3', '4'];
    const expected: Event[] = []; //빈배열이 기대값

    const result = getUpcomingEvents(events, fixedNow, notifiedEvents);
    expect(result).toEqual(expected);
  });

  it('알림 시간이 아직 도래하지 않은 이벤트는 반환하지 않는다', () => {
    //notifiedEvents 값에 상관없이 이벤트2는 반환하지않아야함
    const notifiedEvents: string[] = [];

    // 이벤트 2: 12:30 시작, notificationTime: 15분 → 30 - 15 = 15분 남음
    // timeDiff = 30분 > notificationTime (15분), 제외됨
    const result = getUpcomingEvents(events, fixedNow, notifiedEvents);
    expect(result).not.toContainEqual(events[1]);
  });

  it('알림 시간이 지난 이벤트는 반환하지 않는다', () => {
    //notifiedEvents 값에 상관없이 이벤트3은 반환하지않아야함
    const notifiedEvents: string[] = [];
    // 이벤트 3: 11:50 시작, notificationTime: 15분 → 이미 시작됨

    const result = getUpcomingEvents(events, fixedNow, notifiedEvents);
    expect(result).not.toContainEqual(events[2]);
  });

  // FIXME: 테스트 문구가 정확하지 못함. -위에서 모두 테스트된 내용이므로 필요없는 테스트로 보입니다.
  it('여러 조건을 만족하는 이벤트를 정확히 반환한다', () => {
    const notifiedEvents: string[] = ['3'];

    // 이벤트 1: 12:15 시작, notificationTime: 15분 → 포함
    // 이벤트 4: 12:05 시작, notificationTime: 10분 → timeDiff = 5분 >0 && <=10 → 포함
    // 이벤트 3: 알림이 이미 간 상태, 제외

    const result = getUpcomingEvents(events, fixedNow, notifiedEvents);
    expect(result).toEqual([events[0], events[3]]);
    expect(result).not.toContainEqual(events[2]);
  });
});

describe('createNotificationMessage', () => {
  it('올바른 알림 메시지를 생성해야 한다', () => {
    const event: Event = createMockEvent({
      id: '1',
      title: '회의',
      date: '2024-11-03',
      startTime: '12:15',
      endTime: '10:00',
      notificationTime: 15,
      description: '회의 설명',
      location: '회의실',
      category: '업무',
    });

    const expectedMessage = '15분 후 회의 일정이 시작됩니다.';
    const message = createNotificationMessage(event);
    expect(message).toBe(expectedMessage);
  });

  it('notificationTime이 0인 경우 메시지가 올바르게 생성된다', () => {
    const event: Event = createMockEvent({
      id: '2',
      title: '긴급 회의',
      date: '2024-11-03',
      startTime: '12:00',
      endTime: '13:00',
      notificationTime: 0,
      description: '긴급 회의 설명',
      location: '긴급실',
      category: '긴급',
    });

    const expectedMessage = '0분 후 긴급 회의 일정이 시작됩니다.';
    const message = createNotificationMessage(event);
    expect(message).toBe(expectedMessage);
  });

  it('title이 빈 문자열인 경우에도 메시지가 생성된다', () => {
    const event: Event = createMockEvent({
      id: '3',
      title: '',
      date: '2024-11-03',
      startTime: '13:00',
      endTime: '14:00',
      notificationTime: 10,
      description: '빈 제목 이벤트 설명',
      location: '장소 없음',
      category: '기타',
    });

    const expectedMessage = '10분 후  일정이 시작됩니다.';
    const message = createNotificationMessage(event);
    expect(message).toBe(expectedMessage);
  });
});
