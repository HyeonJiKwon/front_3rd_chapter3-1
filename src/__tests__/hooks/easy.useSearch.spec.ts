import { act, renderHook } from '@testing-library/react';

import { useSearch } from '../../hooks/useSearch.ts';
import { Event } from '../../types.ts';
import { createMockEvent } from '../utils.ts';

describe('useSearch', () => {
  const events: Event[] = [
    createMockEvent({
      id: '1',
      title: '회의',
      description: '팀 회의입니다.',
      location: '회의실 A',
      date: '2024-10-01',
      startTime: '09:00',
      endTime: '10:00',
      notificationTime: 30,
      category: '업무',
    }),
    createMockEvent({
      id: '2',
      title: '점심 식사',
      description: '점심을 먹습니다.',
      location: '식당 B',
      date: '2024-10-01',
      startTime: '12:00',
      endTime: '13:00',
      notificationTime: 15,
      category: '식사',
    }),
    createMockEvent({
      id: '3',
      title: '운동',
      description: '헬스장 운동입니다.',
      location: '헬스장 C',
      date: '2024-10-02',
      startTime: '18:00',
      endTime: '19:00',
      notificationTime: 20,
      category: '운동',
    }),
    createMockEvent({
      id: '4',
      title: '저녁 식사',
      description: '저녁을 먹습니다.',
      location: '식당 D',
      date: '2024-10-31',
      startTime: '19:00',
      endTime: '20:00',
      notificationTime: 15,
      category: '식사',
    }),
  ];

  const viewWeek: 'week' = 'week';
  const viewMonth: 'month' = 'month';

  it('검색어가 비어있을 때 모든 이벤트를 반환해야 한다', () => {
    const { result } = renderHook(() => useSearch(events, new Date(), viewMonth));
    expect(result.current.filteredEvents).toEqual(events);
  });

  it('검색어에 맞는 이벤트만 필터링해야 한다', () => {
    const { result } = renderHook(() => useSearch(events, new Date(), viewMonth));

    act(() => {
      result.current.setSearchTerm('점심');
    });

    expect(result.current.filteredEvents).toEqual([events[1]]);
  });

  it('검색어가 제목, 설명, 위치 중 하나라도 일치하면 해당 이벤트를 반환해야 한다', () => {
    const { result } = renderHook(() => useSearch(events, new Date(), viewMonth));

    act(() => {
      result.current.setSearchTerm('헬스장');
    });

    expect(result.current.filteredEvents).toEqual([events[2]]);
  });

  // INFO: 세부적으로 테스트케이스를 나눠보았습니다. (주/월간)
  describe('현재 뷰(주간/월간)에 해당하는 이벤트만 반환해야 한다', () => {
    it('이번 주에 해당하는 이벤트만 반환해야 한다', () => {
      const { result } = renderHook(() => useSearch(events, new Date(), viewWeek));
      expect(result.current.filteredEvents).toEqual([events[0], events[1], events[2]]);
    });

    it('이번 달에 해당하는 이벤트만 반환해야 한다', () => {
      events.push(
        createMockEvent({
          id: '5',
          title: '저녁 식사',
          description: '저녁을 먹습니다.',
          location: '식당 E',
          date: '2024-11-05',
          startTime: '19:00',
          endTime: '20:00',
          notificationTime: 15,
          category: '식사',
        })
      );
      const { result } = renderHook(() => useSearch(events, new Date(), viewMonth));
      expect(result.current.filteredEvents).toEqual(events.slice(0, -1));
    });
  });

  it("검색어를 '회의'에서 '점심'으로 변경하면 필터링된 결과가 즉시 업데이트되어야 한다", () => {
    const { result } = renderHook(() => useSearch(events, new Date(), viewMonth));

    act(() => {
      result.current.setSearchTerm('회의');
    });

    expect(result.current.filteredEvents).toEqual([events[0]]);

    act(() => {
      result.current.setSearchTerm('점심');
    });

    expect(result.current.filteredEvents).toEqual([events[1]]);
  });
});
