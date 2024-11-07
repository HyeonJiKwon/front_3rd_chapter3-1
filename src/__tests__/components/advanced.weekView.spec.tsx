import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';
import { Mock } from 'vitest';

import { WeekView } from '../../components/WeekView';
import { Event } from '../../types';
import { formatWeek, getWeekDates } from '../../utils/dateUtils';

const setup = (element: ReactElement) => {
  return render(<ChakraProvider>{element}</ChakraProvider>);
};

// dateUtils 모듈을 모킹합니다.
vi.mock('../../utils/dateUtils', () => ({
  getWeekDates: vi.fn(),
  formatWeek: vi.fn(),
}));
const weekDates = [
  new Date('2024-09-29'), // 일요일
  new Date('2024-09-30'), // 월요일
  new Date('2024-10-01'), // 화요일
  new Date('2024-10-02'), // 수요일
  new Date('2024-10-03'), // 목요일
  new Date('2024-10-04'), // 금요일
  new Date('2024-10-05'), // 토요일
];
beforeEach(() => {
  // 모킹된 함수의 반환 값 설정
  (getWeekDates as Mock).mockReturnValue(weekDates);
  (formatWeek as Mock).mockReturnValue('2024년 10월 1주');
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('WeekView 컴포넌트 테스트', () => {
  describe('날짜 및 요일 표기 확인', () => {
    beforeEach(() => {
      setup(<WeekView currentDate={new Date()} filteredEvents={[]} notifiedEvents={[]} />);
    });
    it('요일 헤더가 올바르게 렌더링되어야 합니다.', async () => {
      const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

      weekDays.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('현재 주의 날짜가 올바르게 표시되어야 합니다.', () => {
      const mockFormatWeek = formatWeek;
      // formatWeek가 올바르게 호출되었는지 확인
      expect(mockFormatWeek).toHaveBeenCalledWith(new Date());
      // 포맷된 주간 문자열이 렌더링되었는지 확인
      expect(screen.getByText('2024년 10월 1주')).toBeInTheDocument();
    });

    it('각 날짜에 대한 셀이 올바르게 렌더링되어야 합니다.', () => {
      weekDates.forEach((date) => {
        expect(screen.getByText(date.getDate().toString())).toBeInTheDocument();
      });
    });
  });

  describe('이벤트 표기 확인', () => {
    it('알림된 이벤트는 BellIcon과 함께 강조 표시되어야 합니다.', () => {
      const events: Event[] = [
        {
          id: '1',
          title: '회의',
          date: '2024-10-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ];
      const notifiedEvents = ['1'];
      setup(
        <WeekView
          currentDate={new Date()}
          filteredEvents={events}
          notifiedEvents={notifiedEvents}
        />
      );
      expect(screen.getByTestId('bell-icon-1')).toBeInTheDocument();

      // 이벤트 박스의 스타일이 강조되었는지 확인
      const eventBox = screen.getByText('회의').closest('div');
      expect(eventBox).toHaveStyle('background: red.100');
      expect(screen.getByText('회의')).toHaveStyle('color: red.500');
    });

    it('이벤트가 없는 날짜는 빈 상태로 표시되어야 합니다.', async () => {
      setup(<WeekView currentDate={new Date()} filteredEvents={[]} notifiedEvents={[]} />);
      weekDates.forEach((date) => {
        const dateElement = screen.getByText(date.getDate().toString());
        const cell = dateElement.closest('td');
        // td 안에 날짜 텍스트 외에 다른 요소가 없는지 확인
        if (cell) {
          const eventBoxes = cell.querySelectorAll('div > div');
          expect(eventBoxes.length).toBe(0);
        }
      });
    });
    it('여러 이벤트가 하나의 날짜에 있을 경우 모두 올바르게 렌더링되어야 합니다.', () => {
      const events: Event[] = [
        {
          id: '1',
          title: '회의',
          date: '2024-10-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
        {
          id: '2',
          title: '점심 식사',
          date: '2024-10-01',
          startTime: '12:00',
          endTime: '13:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ];
      setup(<WeekView currentDate={new Date()} filteredEvents={events} notifiedEvents={[]} />);
      expect(screen.getByText('회의')).toBeInTheDocument();
      expect(screen.getByText('점심 식사')).toBeInTheDocument();
    });
  });
});
