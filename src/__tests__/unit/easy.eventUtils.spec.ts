import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';
import { createMockEvent } from '../utils';

describe('getFilteredEvents', () => {
  const events: Event[] = [
    createMockEvent({
      id: '1',
      title: '이벤트 1',
      date: '2024-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '첫 번째 이벤트',
      location: '장소 A',
      category: '카테고리 1',
    }),
    createMockEvent({
      id: '2',
      title: '이벤트 2',
      date: '2024-07-01',
      startTime: '12:00',
      endTime: '13:00',
      description: '두 번째 이벤트',
      location: '장소 B',
      category: '카테고리 2',
    }),
    createMockEvent({
      id: '3',
      title: '이벤트 3',
      date: '2024-07-02',
      startTime: '14:00',
      endTime: '15:00',
      description: '세 번째 이벤트',
      location: '장소 C',
      category: '카테고리 3',
    }),
    createMockEvent({
      id: '4',
      title: '특별 이벤트',
      date: '2024-07-31',
      startTime: '16:00',
      endTime: '17:00',
      description: '월말 이벤트',
      location: '장소 D',
      category: '카테고리 4',
    }),
  ];

  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const searchTerm = '이벤트 2';
    const currentDate = new Date('2024-07-01');
    const view: 'week' = 'week';

    const expected = events.filter(
      (event) => event.title.includes(searchTerm) || event.description.includes(searchTerm)
    );

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it('주간 뷰에서 2024-07-01 주의 이벤트만 반환한다', () => {
    const searchTerm = '';
    const currentDate = new Date('2024-07-01');
    const view: 'week' = 'week';

    // 해당 주는 2024-06-30 (일) ~ 2024-07-06 (토)
    const expected = events.filter((event) => {
      const eventDate = new Date(event.date);
      const startOfWeek = new Date('2024-06-30');
      const endOfWeek = new Date('2024-07-06');
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it('월간 뷰에서 2024년 7월의 모든 이벤트를 반환한다', () => {
    const searchTerm = '';
    const currentDate = new Date('2024-07-01');
    const view: 'month' = 'month';

    const expected = events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === 2024 && eventDate.getMonth() === 6; // 7월은 6
    });

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
    const searchTerm = '이벤트';
    const currentDate = new Date('2024-07-01');
    const view: 'week' = 'week';

    // 먼저 검색어 필터링
    const searchedEvents = events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 그 다음 주간 필터링
    const expected = searchedEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const startOfWeek = new Date('2024-06-30');
      const endOfWeek = new Date('2024-07-06');
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const searchTerm = '';
    const currentDate = new Date('2024-07-01');
    const view: 'week' = 'week';

    // 주간 필터링만 적용
    const expected = events.filter((event) => {
      const eventDate = new Date(event.date);
      const startOfWeek = new Date('2024-06-30');
      const endOfWeek = new Date('2024-07-06');
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const searchTerm = '이벤트';
    const currentDate = new Date('2024-07-01');
    const view: 'month' = 'month';

    // 대소문자 무시하고 검색
    const searchedEvents = events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 월간 필터링
    const expected = searchedEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === 2024 && eventDate.getMonth() === 6; // 7월은 6
    });

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it('월의 경계에 있는 이벤트를 올바르게 필터링한다', () => {
    const searchTerm = '';
    const currentDate = new Date('2024-07-01');
    const view: 'month' = 'month';

    // 7월 31일 이벤트가 올바르게 포함되는지 확인
    const expected = events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === 2024 && eventDate.getMonth() === 6; // 7월은 6
    });

    const result = getFilteredEvents(events, searchTerm, currentDate, view);

    expect(result).toEqual(expected);
  });

  it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
    const searchTerm = '이벤트';
    const emptyEvents: Event[] = [];
    const currentDate = new Date('2024-07-01');
    const viewWeek: 'week' = 'week';
    const viewMonth: 'month' = 'month';

    const resultWeek = getFilteredEvents(emptyEvents, searchTerm, currentDate, viewWeek);
    const resultMonth = getFilteredEvents(emptyEvents, searchTerm, currentDate, viewMonth);

    expect(resultWeek).toEqual([]);
    expect(resultMonth).toEqual([]);
  });
});
