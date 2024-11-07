import { useToast } from '@chakra-ui/react';
import { act, renderHook } from '@testing-library/react';

import useEventValidation from '../../hooks/useEventValidation';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

describe('useEventValidation 훅 테스트', () => {
  it('필수 필드가 모두 입력되지 않은 경우 에러 토스트를 표시해야 합니다.', () => {
    const { result } = renderHook(() => useEventValidation());

    act(() => {
      const isValid = result.current.validate({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        startTimeError: null,
        endTimeError: null,
      });
      expect(isValid).toBe(false);
      expect(toastFn).toHaveBeenCalledWith({
        title: '필수 정보를 모두 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
  });

  it('시작 시간 또는 종료 시간에 에러가 있는 경우 에러 토스트를 표시해야 합니다.', () => {
    const { result } = renderHook(() => useEventValidation());

    act(() => {
      const isValid = result.current.validate({
        title: '회의',
        date: '2024-12-01',
        startTime: '12:00',
        endTime: '11:00',
        startTimeError: '시작 시간은 종료 시간보다 빨라야 합니다.',
        endTimeError: '종료 시간은 시작 시간보다 늦어야 합니다.',
      });
      expect(isValid).toBe(false);
      expect(toastFn).toHaveBeenCalledWith({
        title: '시간 설정을 확인해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
  });

  it('모든 필드가 유효한 경우 true를 반환하고 토스트를 호출하지 않아야 합니다.', () => {
    const { result } = renderHook(() => useEventValidation());

    act(() => {
      const isValid = result.current.validate({
        title: '회의',
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        startTimeError: null,
        endTimeError: null,
      });
      expect(isValid).toBe(true);
      expect(toastFn).not.toHaveBeenCalled();
    });
  });
});
