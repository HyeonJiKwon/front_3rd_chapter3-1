import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';
import { createMockEvent } from './utils';

// ! HINT. 이 유틸을 사용해 리액트 컴포넌트를 렌더링해보세요.
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Medium: 여기서 ChakraProvider로 묶어주는 동작은 의미있을까요? 있다면 어떤 의미일까요?
  /**
   * ChakraProvider는 Chakra UI 라이브러리에서 제공하는 컨텍스트 프로바이더로, 테마, 스타일링, 그리고 Chakra UI 컴포넌트들이 제대로 동작하기 위한 설정을 제공합니다. 테스트 환경에서 ChakraProvider로 컴포넌트를 감싸주는 것은 다음과 같은 이유로 의미가 있습니다:
    테마 및 스타일링 적용: Chakra UI 컴포넌트들이 테마와 스타일을 올바르게 적용받을 수 있도록 합니다. 테마 관련 속성이 없으면 컴포넌트가 예상과 다르게 렌더링될 수 있습니다.
    컨텍스트 제공: Chakra UI의 일부 컴포넌트는 내부적으로 컨텍스트를 사용합니다. 예를 들어, Modal, Tooltip 등은 ChakraProvider의 컨텍스트를 필요로 합니다.
    일관된 테스트 환경: 실제 애플리케이션과 동일한 환경에서 컴포넌트를 테스트할 수 있어, 테스트의 신뢰성을 높입니다.
    따라서, ChakraProvider로 컴포넌트를 감싸주는 것은 Chakra UI를 사용하는 애플리케이션의 컴포넌트를 테스트할 때 중요하고 의미 있는 동작입니다.
   */
};
// ! HINT. 이 유틸을 사용해 일정을 저장해보세요.
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);
  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  await user.click(screen.getByTestId('event-submit-button'));
};

// beforeEach(() => setup(<App />));

// ! HINT. "검색 결과가 없습니다"는 초기에 노출되는데요. 그럼 검증하고자 하는 액션이 실행되기 전에 검증해버리지 않을까요? 이 테스트를 신뢰성있게 만드려면 어떻게 할까요?
describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    // ! HINT. event를 추가 제거하고 저장하는 로직을 잘 살펴보고, 만약 그대로 구현한다면 어떤 문제가 있을 지 고민해보세요.
    setupMockHandlerCreation();
    const user = setup(<App />).user;

    await saveSchedule(
      user,
      createMockEvent({
        title: '회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      })
    );

    const eventList = screen.getByTestId('event-list');
    // 검색결과없는거 확인
    // 검색결과 들어왔는지 확인 .
    expect(within(eventList).getByText('회의')).toBeInTheDocument();
    expect(within(eventList).getByText('2024-10-31')).toBeInTheDocument();
    expect(within(eventList).getByText(/10:00/)).toBeInTheDocument();
    expect(within(eventList).getByText(/11:15/)).toBeInTheDocument();
    expect(within(eventList).getByText('설명')).toBeInTheDocument();
    expect(within(eventList).getByText('회의실')).toBeInTheDocument();
    expect(within(eventList).getByText(/업무/)).toBeInTheDocument();
  });

  // it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {});

  // it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {});
});

// describe('일정 뷰', () => {
//   it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {});

//   it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {});

//   it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {});

//   it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {});

//   it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {});
// });

// describe('검색 기능', () => {
//   it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {});

//   it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {});

//   it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {});
// });

// describe('일정 충돌', () => {
//   it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {});

//   it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {});
// });

// it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {});
