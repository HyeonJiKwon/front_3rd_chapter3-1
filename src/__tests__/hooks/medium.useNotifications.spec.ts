import { act, renderHook } from '@testing-library/react';

import { useNotifications } from '../../hooks/useNotifications.ts';
import { Event } from '../../types.ts';
import { formatDate } from '../../utils/dateUtils.ts';
import { createMockEvent, parseHM } from '../utils.ts';

// import { getUpcomingEvents, createNotificationMessage } from '../../utils/notificationUtils';

describe('useNotifications', () => {
  const mockEvents: Event[] = [
    createMockEvent({
      id: '1',
      title: '회의',
      date: '2024-11-03',
      startTime: '10:15', // 15분 후
      endTime: '11:15',
      notificationTime: 10, // 10분 전 알림
      description: '회의 설명',
      location: '회의실',
      category: '업무',
    }),
    createMockEvent({
      id: '2',
      title: '점심 식사',
      date: '2024-11-03',
      startTime: '10:30', // 30분 후
      endTime: '11:30',
      notificationTime: 15, // 15분 전 알림
      description: '점심 식사 설명',
      location: '식당',
      category: '식사',
    }),
  ];

  it('초기 상태에서는 알림이 없어야 한다', () => {
    const { result } = renderHook(() => useNotifications(mockEvents));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.notifiedEvents).toEqual([]);
  });

  it('지정된 시간이 된 경우 알림이 새롭게 생성되어 추가된다', async () => {
    const { result } = renderHook(() => useNotifications(mockEvents));
    // 12:00:00에서 10분 후인 12:10:00로 시간을 이동 (600,000ms)
    await act(async () => {
      vi.advanceTimersByTime(36000000); // 10시간
    });
    console.log(new Date());

    // 10분 후에 첫 번째 이벤트에 대한 알림이 생성되어야 함 (10:15 시작, 10분 전 알림: 10:05)
    await act(async () => {
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].id).toBe('1');
      // expect(result.current.notifications[0].message).toBe(
      //   createNotificationMessage(mockEvents[0])
      // );
      expect(result.current.notifiedEvents).toContain('1');
    });

    // 추가로 15분을 더 이동하여 두 번째 이벤트에 대한 알림이 생성되도록 함 (12:30 시작, 15분 전 알림: 12:15)
    // act(() => {
    //   vi.advanceTimersByTime(900000); // 15분
    // });

    // await waitFor(() => {
    //   expect(result.current.notifications).toHaveLength(2);
    //   expect(result.current.notifications[1].id).toBe('2');
    //   expect(result.current.notifications[1].message).toBe(
    //     createNotificationMessage(mockEvents[1])
    //   );
    //   expect(result.current.notifiedEvents).toContain('2');
    // });
    // });

    // it('index를 기준으로 알림을 적절하게 제거할 수 있다', async () => {
    //   const { result } = renderHook(() => useNotifications(mockEvents));

    //   // 10분 후 첫 번째 알림 생성
    //   act(() => {
    //     vi.advanceTimersByTime(600000); // 10분
    //   });

    //   await waitFor(() => {
    //     expect(result.current.notifications).toHaveLength(1);
    //   });

    //   // 15분 후 두 번째 알림 생성
    //   act(() => {
    //     vi.advanceTimersByTime(900000); // 15분
    //   });

    //   await waitFor(() => {
    //     expect(result.current.notifications).toHaveLength(2);
    //   });

    //   // 첫 번째 알림(인덱스 0)을 제거
    //   act(() => {
    //     result.current.removeNotification(0);
    //   });

    //   expect(result.current.notifications).toHaveLength(1);
    //   expect(result.current.notifications[0].id).toBe('2');
    // });

    // it('이미 알림이 발생한 이벤트에 대해서는 중복 알림이 발생하지 않아야 한다', async () => {
    //   const { result } = renderHook(() => useNotifications(mockEvents));

    //   // 10분 후 첫 번째 알림 생성
    //   act(() => {
    //     vi.advanceTimersByTime(600000); // 10분
    //   });

    //   await waitFor(() => {
    //     expect(result.current.notifications).toHaveLength(1);
    //     expect(result.current.notifications[0].id).toBe('1');
    //     expect(result.current.notifiedEvents).toContain('1');
    //   });

    //   // 15분 후 두 번째 알림 생성
    //   act(() => {
    //     vi.advanceTimersByTime(900000); // 15분
    //   });

    //   await waitFor(() => {
    //     expect(result.current.notifications).toHaveLength(2);
    //     expect(result.current.notifications[1].id).toBe('2');
    //     expect(result.current.notifiedEvents).toContain('2');
    //   });

    //   // 추가로 시간을 이동하여 중복 알림이 발생하지 않는지 확인 (예: 30분 더 이동)
    //   act(() => {
    //     vi.advanceTimersByTime(1800000); // 30분
    //   });

    //   await waitFor(() => {
    //     expect(result.current.notifications).toHaveLength(2); // 추가 알림 없음
    //   });
  });
});
