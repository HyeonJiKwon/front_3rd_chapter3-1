import { act, renderHook } from '@testing-library/react';

import { useNotifications } from '../../hooks/useNotifications.ts';
import { Event } from '../../types.ts';
import { formatDate } from '../../utils/dateUtils.ts';
import { createMockEvent, parseHM } from '../utils.ts';

describe('useNotifications', () => {
  const mockEvents: Event[] = [
    createMockEvent({
      id: '1',
      title: '회의',
      date: '2024-11-01',
      startTime: '10:00',
      endTime: '11:15',
      notificationTime: 10, // 10분 전 알림(9:50)
      description: '회의 설명',
      location: '회의실',
      category: '업무',
    }),
  ];

  it('초기 상태에서는 알림이 없어야 한다', () => {
    const { result } = renderHook(() => useNotifications(mockEvents));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.notifiedEvents).toEqual([]);
  });

  it('지정된 시간이 된 경우 알림이 새롭게 생성되어 추가된다', async () => {
    vi.setSystemTime(new Date('2024-11-01T09:50:00'));

    const { result } = renderHook(() => useNotifications(mockEvents));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // 첫 번째 이벤트에 대한 알림이 생성되어야 함
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe('1');
    expect(result.current.notifiedEvents).toContain('1');
  });

  it('index를 기준으로 알림을 적절하게 제거할 수 있다', async () => {
    vi.setSystemTime(new Date('2024-11-01T09:50:00'));

    const { result } = renderHook(() => useNotifications(mockEvents));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.notifications).toHaveLength(1);
    // 첫 번째 알림(인덱스 0)을 제거
    act(() => {
      result.current.removeNotification(0);
    });
    expect(result.current.notifications).toHaveLength(0);
  });

  it('이미 알림이 발생한 이벤트에 대해서는 중복 알림이 발생하지 않아야 한다', async () => {
    vi.setSystemTime(new Date('2024-11-01T09:50:00'));

    const { result } = renderHook(() => useNotifications(mockEvents));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifiedEvents).toContain('1');
    // 1초뒤 Interval 시에도 같은 이벤트에 대해 중복 알림이 발생하였는지 확인
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifiedEvents).toContain('1');
    // 추가로 시간을 이동하여 중복 알림이 발생하지 않있는지 확인 (예: 30분 더 이동)
    act(() => {
      vi.advanceTimersByTime(1800000); // 30분
    });

    expect(result.current.notifications).toHaveLength(1); // 추가 알림 없음
    expect(result.current.notifiedEvents).toContain('1');
  });
});
