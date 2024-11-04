import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';
import { createMockEvent } from '../utils.ts';

// ? Medium: 아래 toastFn과 mock과 이 fn은 무엇을 해줄까요?
const toastFn = vi.fn();
/**
 * toastFn는 모킹 함수입니다.
 * vi.fn 는
 */
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

describe('useEventOperations', () => {
  // 초기 이벤트 데이터를 불러오는 테스트
  // INFO: 테스트 케이스 문구를 더 정확하게 변경하였습니다.
  it('저장되어있는 초기 이벤트 데이터가 정상적으로 호툴된다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events).toEqual([
      {
        id: '1',
        title: '기존 회의',
        date: '2024-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);
  });

  // INFO: 토스트 호출 유무도 확인합니다.
  it('초기 로딩 완료 토스트가 호출되었는지 확인', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.fetchEvents();
    });

    // 초기 로딩 완료 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '일정 로딩 완료!',
      status: 'info',
      duration: 1000,
    });
  });

  // 이벤트 저장 (생성) 테스트
  it('정의된 이벤트 정보가 그대로 저장이 된다', async () => {
    const { result } = renderHook(() => useEventOperations(false, () => {}));

    const newEvent = createMockEvent({
      title: '새 이벤트',
      date: '2024-11-04',
      startTime: '14:00',
      endTime: '15:00',
      notificationTime: 10,
      description: '새 이벤트 설명',
      location: '새 장소',
      category: '새 카테고리',
    });

    setupMockHandlerCreation([newEvent]);

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[1].title).toBe('새 이벤트');

    // 저장 성공 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '일정이 추가되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  });

  // 이벤트 업데이트 (수정) 테스트
  it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
    const { result } = renderHook(() => useEventOperations(true, () => {}));

    const updatedEvent: Event = createMockEvent({
      id: '1',
      title: '수정된 회의',
      date: '2024-11-03',
      startTime: '12:15',
      endTime: '13:30', // endTime 수정
      notificationTime: 15,
      description: '수정된 회의 설명',
      location: '회의실 A',
      category: '업무',
    });

    setupMockHandlerUpdating();

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    const event = result.current.events.find((e) => e.id === '1');
    expect(event).toBeDefined();
    expect(event?.title).toBe('수정된 회의');
    expect(event?.endTime).toBe('13:30');

    // INFO: 토스트 호출 유무 따로 확인합니다.
    // 업데이트 성공 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '일정이 수정되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  });

  // 이벤트 삭제 테스트
  it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    setupMockHandlerDeletion();

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(result.current.events).toHaveLength(0);

    // 삭제 성공 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '일정이 삭제되었습니다.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  });

  // 이벤트 로딩 실패 시 에러 토스트 표시 테스트
  it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
    // NOTE: GET /api/events를 실패하도록 핸들러 재정의 (https://mswjs.io/docs/recipes/network-errors/)
    server.use(
      http.get('/api/events', () => {
        return new HttpResponse(null, { status: 401 }); // 이건 특정 error status code
      })
    );

    const { result } = renderHook(() => useEventOperations(false));
    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.events).toHaveLength(0);

    // 에러 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '이벤트 로딩 실패',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  });

  // 존재하지 않는 이벤트 수정 시 에러 토스트 표시 테스트
  it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
    const { result } = renderHook(() => useEventOperations(true));

    const nonExistentEvent: Event = createMockEvent({
      id: '999', // 존재하지 않는 ID
      title: '없는 이벤트',
      date: '2024-11-05',
      startTime: '15:00',
      endTime: '16:00',
      notificationTime: 20,
      description: '없는 이벤트 설명',
      location: '없는 장소',
      category: '없음',
    });

    await act(async () => {
      await result.current.saveEvent(nonExistentEvent);
    });

    // 저장 실패 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '일정 저장 실패',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });

    // 이벤트 목록에 변경이 없는지 확인
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events.find((e) => e.id === '999')).toBeUndefined();
  });

  // 네트워크 오류 시 이벤트 삭제 실패 테스트
  it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
    const { result } = renderHook(() => useEventOperations(false));

    // NOTE: DELETE /api/events/:id를 실패하도록 핸들러 재정의
    server.use(
      http.delete('/api/events/:id', () => {
        return HttpResponse.error(); // 이건 네트워크 에러
      })
    );

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    // 삭제 실패 토스트가 호출되었는지 확인
    expect(toastFn).toHaveBeenCalledWith({
      title: '일정 삭제 실패',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });

    // 이벤트 목록에 삭제되지 않았는지 확인
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events.find((e) => e.id === '1')).toBeDefined();
  });
});
