import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within } from '@testing-library/react';

import { MonthView } from '../../components/MonthView';
import { Event } from '../../types';

describe('MonthView 컴포넌트 테스트', () => {
  const setup = () => {
    const defaultProps = {
      currentDate: new Date(),
      holidays: {
        ['2024-10-31']: '추석',
      },
      filteredEvents: [
        {
          id: '1',
          title: '회의',
          date: '2024-10-31',
          startTime: '10:00',
          endTime: '11:15',
          category: '업무',
          description: '팀 회의',
          location: '회의실 A',
        },
        {
          id: '2',
          title: '점심식사',
          date: '2024-10-31',
          startTime: '12:00',
          endTime: '13:15',
          category: '개인',
          description: '친구와 점심',
          location: '식당 B',
        },
      ] as Event[],
      notifiedEvents: ['1'], // 이벤트 ID '1'은 알림됨
    };

    return render(
      <ChakraProvider>
        <MonthView {...defaultProps} />
      </ChakraProvider>
    );
  };

  it('현재 월이 올바르게 표시되는지 확인', () => {
    setup();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('10월');
  });

  it('요일이 올바르게 표시되는지 확인', () => {
    setup();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    weekDays.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('각 날짜가 올바르게 렌더링되는지 확인', () => {
    setup();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('공휴일이 올바르게 표시되는지 확인', () => {
    setup();
    // 31일에 '추석' 공휴일이 표시되는지 확인
    const holidayCell = screen.getByText('추석');
    expect(holidayCell).toBeInTheDocument();
    expect(holidayCell).toHaveStyle('color: red.500');
  });

  it('이벤트가 올바른 날짜에 표시되는지 확인', () => {
    setup();
    // 31일 셀을 찾아 이벤트가 표시되는지 확인
    const eventDate = screen.getByText('31');
    const eventCell = eventDate.closest('td');
    expect(eventCell).toBeInTheDocument();

    // 이벤트 타이틀이 표시되는지 확인
    expect(within(eventCell!).getByText('회의')).toBeInTheDocument();
    expect(within(eventCell!).getByText('점심식사')).toBeInTheDocument();
  });

  it('알림된 이벤트가 올바르게 표시되는지 확인', () => {
    setup();
    // 알림된 이벤트 '회의'에 BellIcon이 표시되는지 확인
    const eventTitle = screen.getByText('회의');
    const eventBox = eventTitle.closest('div');
    expect(eventBox).toBeInTheDocument();

    expect(screen.getByTestId('bell-icon-1')).toBeInTheDocument();

    // 이벤트 박스의 스타일이 강조되었는지 확인
    expect(eventBox).toHaveStyle('background: red.100');
    expect(screen.getByText('회의')).toHaveStyle('color: red.500');
  });

  it('이벤트가 없을 때 올바르게 처리되는지 확인', () => {
    render(
      <ChakraProvider>
        <MonthView
          currentDate={new Date('2024-10-01')}
          holidays={{}}
          filteredEvents={[]}
          notifiedEvents={[]}
        />
      </ChakraProvider>
    );

    // 이벤트가 없는 날짜에 이벤트 박스가 렌더링되지 않는지 확인
    const allEventBoxes = screen.queryAllByText(/회의|점심식사/i);
    expect(allEventBoxes.length).toBe(0);
  });
});
