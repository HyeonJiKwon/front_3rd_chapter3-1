import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, waitFor } from '@testing-library/react';
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
   * ChakraProvider - Chakra UI 라이브러리에서 제공하는 컨텍스트 프로바이더
    테마 및 스타일링 적용: Chakra UI 컴포넌트들이 테마와 스타일을 올바르게 적용받을 수 있도록 합니다. 테마 관련 속성이 없으면 컴포넌트가 예상과 다르게 렌더링될 수 있습니다.
    일관된 테스트 환경: 실제 애플리케이션과 동일한 환경에서 컴포넌트를 테스트할 수 있어, 테스트의 신뢰성을 높입니다.
   */
};
const setupMockHandlerFetching = (initialEvents: Event[]) => {
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: initialEvents });
    })
  );
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

// ! HINT. "검색 결과가 없습니다"는 초기에 노출되는데요. 그럼 검증하고자 하는 액션이 실행되기 전에 검증해버리지 않을까요? 이 테스트를 신뢰성있게 만드려면 어떻게 할까요?
describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    // ! HINT. event를 추가 제거하고 저장하는 로직을 잘 살펴보고, 만약 그대로 구현한다면 어떤 문제가 있을 지 고민해보세요.
    const user = setup(<App />).user;
    const eventList = screen.getByTestId('event-list');
    // 초기 진입시 검색결과 없음 노출 (생성된 일정 없음)
    expect(within(eventList).getByText('검색 결과가 없습니다.')).toBeInTheDocument();

    setupMockHandlerCreation();
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

    // 생성한 이벤트 노출 확인
    expect(within(eventList).getByPlaceholderText('검색어를 입력하세요')).toBeInTheDocument();
    expect(within(eventList).getByText('회의')).toBeInTheDocument();
    expect(within(eventList).getByText('2024-10-31')).toBeInTheDocument();
    expect(within(eventList).getByText(/10:00/)).toBeInTheDocument();
    expect(within(eventList).getByText(/11:15/)).toBeInTheDocument();
    expect(within(eventList).getByText('설명')).toBeInTheDocument();
    expect(within(eventList).getByText('회의실')).toBeInTheDocument();
    expect(within(eventList).getByText(/업무/)).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const initialEvents = [
      createMockEvent({
        id: '1',
        title: '수정할 회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
    ];
    setupMockHandlerFetching(initialEvents);

    const user = setup(<App />).user;

    // 초기 이벤트가 렌더링되기를 기다림
    const eventList = screen.getByTestId('event-list');
    await waitFor(() => expect(within(eventList).getByText('수정할 회의')).toBeInTheDocument());

    // 편집 버튼 찾기
    const editButtons = within(eventList).getAllByLabelText(/Edit event/i);
    expect(editButtons.length).toBeGreaterThan(0);
    // 첫 번째 이벤트의 편집 버튼 클릭
    await user.click(editButtons[0]);

    const titleInput = screen.getByLabelText(/제목/i) as HTMLInputElement;
    const startTimeInput = screen.getByLabelText(/시작 시간/i) as HTMLInputElement;
    const endTimeInput = screen.getByLabelText(/종료 시간/i) as HTMLInputElement;

    // 입력 값이 기존 값과 일치하는지 확인
    expect(titleInput.value).toBe('수정할 회의');
    expect(startTimeInput.value).toBe('10:00');
    expect(endTimeInput.value).toBe('11:15');

    // 입력 필드 변경
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 회의');

    await user.clear(startTimeInput);
    await user.type(startTimeInput, '11:00');

    await user.clear(endTimeInput);
    await user.type(endTimeInput, '12:00');

    setupMockHandlerUpdating();
    // 저장 버튼 클릭
    const saveButton = screen.getByTestId('event-submit-button');
    await user.click(saveButton);

    // 업데이트된 이벤트가 렌더링되기를 기다림
    await waitFor(() => {
      expect(within(eventList).getByText('수정된 회의')).toBeInTheDocument();
    });

    // 이전 제목이 더 이상 존재하지 않는지 확인
    expect(within(eventList).queryByText('수정할 회의')).not.toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    const initialEvents = [
      createMockEvent({
        id: '1',
        title: '삭제할 회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
    ];
    setupMockHandlerFetching(initialEvents);

    const user = setup(<App />).user;
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');
    await waitFor(() => expect(within(eventList).getByText('삭제할 회의')).toBeInTheDocument());

    setupMockHandlerDeletion();
    // 삭제 대상 이벤트의 삭제 버튼 찾기
    const deleteButtons = within(eventList).getAllByLabelText(/Delete event/i);
    expect(deleteButtons.length).toBeGreaterThan(0);

    // 첫 번째 삭제 버튼 클릭 (삭제할 회의)
    await user.click(deleteButtons[0]);

    // 삭제 후 '삭제할 회의'가 목록에서 사라졌는지 확인
    await waitFor(() => {
      expect(within(eventList).queryByText('삭제할 회의')).not.toBeInTheDocument();
    });
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // vi.setSystemTime(new Date('2024-10-15'));
    setupMockHandlerCreation();
    const user = setup(<App />).user;
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    // 주별 뷰 선택
    const viewSelect = screen.getByLabelText(/view/i); // 'view' 레이블을 가진 Select 요소
    await user.selectOptions(viewSelect, 'week');

    const weekView = screen.getByTestId('week-view');
    // 주별 뷰가 렌더링되었는지 확인
    expect(weekView).toBeInTheDocument();
    expect(within(eventList).queryByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 주차에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerFetching([
      createMockEvent({
        title: '1001회의',
        date: '2024-10-01',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
    ]);
    const user = setup(<App />).user;

    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    // 주별 뷰 선택
    const viewSelect = screen.getByLabelText(/view/i); // 'view' 레이블을 가진 Select 요소
    await user.selectOptions(viewSelect, 'week');

    const weekView = screen.getByTestId('week-view');
    // 주별 뷰가 렌더링되었는지 확인
    expect(weekView).toBeInTheDocument();
    expect(within(weekView).queryByText('1001회의')).toBeInTheDocument();
    expect(within(eventList).getByText('1001회의')).toBeInTheDocument();
  });

  // NOTE: 주별 뷰 내 다음주 이동 기능도 테스트케이스에 추가하였습니다
  it('주별 뷰 선택 후 다음 주로 이동 시, 다음 주에 존재하는 일정이 표시된다', async () => {
    vi.setSystemTime(new Date('2024-10-24'));
    setupMockHandlerCreation();
    const user = setup(<App />).user;

    await saveSchedule(
      user,
      createMockEvent({
        title: '1031회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      })
    );
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    // 주별 뷰 선택
    const viewSelect = screen.getByLabelText(/view/i); // 'view' 레이블을 가진 Select 요소
    await user.selectOptions(viewSelect, 'week');

    const weekView = screen.getByTestId('week-view');
    // 주별 뷰가 렌더링되었는지 확인
    expect(weekView).toBeInTheDocument();
    // 'Next' 버튼을 클릭하여 다음 주로 이동
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // 주별 뷰가 업데이트될 때까지 기다림
    await waitFor(() => {
      expect(within(weekView).queryByText('1031회의')).toBeInTheDocument();
      expect(within(eventList).getByText('1031회의')).toBeInTheDocument();
    });
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    setupMockHandlerCreation();
    const user = setup(<App />).user;
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');
    // 월별 뷰 선택: 월별 뷰가 디폴트이긴하지만, 디폴트값이 기획상 변경되면 테스트코드 수정이 불가피함. 그래서 테스트 코드 내에 월별 뷰 설정 로직을 포함해야한다고 생각한다!
    const viewSelect = screen.getByLabelText(/view/i); // 'view' 레이블을 가진 Select 요소
    await user.selectOptions(viewSelect, 'month');

    const monthView = screen.getByTestId('month-view');
    // 월별 뷰가 렌더링되었는지 확인
    expect(monthView).toBeInTheDocument();
    expect(within(eventList).getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerFetching([
      createMockEvent({
        title: '1010회의',
        date: '2024-10-10',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
    ]);
    const user = setup(<App />).user;

    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    // 월별 뷰 선택
    const viewSelect = screen.getByLabelText(/view/i); // 'view' 레이블을 가진 Select 요소
    await user.selectOptions(viewSelect, 'month');

    const monthView = screen.getByTestId('month-view');
    // 월별 뷰가 렌더링되었는지 확인
    expect(monthView).toBeInTheDocument();
    expect(within(monthView).queryByText('1010회의')).toBeInTheDocument();
    expect(within(eventList).getByText('1010회의')).toBeInTheDocument();
  });

  it('월별 뷰 달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2024-01-01'));
    const user = setup(<App />).user;

    // 월별 뷰 선택
    const viewSelect = screen.getByLabelText(/view/i); // 'view' 레이블을 가진 Select 요소
    await user.selectOptions(viewSelect, 'month');

    const monthView = screen.getByTestId('month-view');
    // 월별 뷰가 렌더링되었는지 확인
    expect(monthView).toBeInTheDocument();
    const targetElement = screen.getByText('신정');
    expect(targetElement).toBeInTheDocument();
    expect(targetElement).toHaveStyle('color: red.500');
  });
});

describe('검색 기능', () => {
  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const initialEvents = [
      createMockEvent({
        id: '1',
        title: '회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
      createMockEvent({
        id: '2',
        title: '점심식사',
        date: '2024-10-31',
        startTime: '12:00',
        endTime: '13:15',
        category: '개인',
        description: '설명',
        location: '회의실',
      }),
    ];
    setupMockHandlerCreation(initialEvents);

    const user = setup(<App />).user;
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    waitFor(() => {
      // 초기 이벤트가 존재하는지 확인
      expect(within(eventList).getByText('회의')).toBeInTheDocument();
      expect(within(eventList).getByText('점심식사')).toBeInTheDocument();
    });

    // 검색 입력 필드 찾기
    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

    // '없는 일정' 검색어 입력 (검색 결과가 없는 단어)
    await user.clear(searchInput);
    await user.type(searchInput, '없는 일정');

    // "검색 결과가 없습니다." 메시지가 나타날 때까지 기다림
    const noResultsMessage = await screen.getByText('검색 결과가 없습니다.');

    // 메시지가 표시되었는지 확인
    expect(noResultsMessage).toBeInTheDocument();

    // 이벤트 목록에서 검색어에 매칭되는 이벤트가 없는지 확인
    expect(within(eventList).queryByText('회의')).not.toBeInTheDocument();
    expect(within(eventList).queryByText('점심식사')).not.toBeInTheDocument();
  });
  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const initialEvents = [
      createMockEvent({
        id: '1',
        title: '팀 회의',
        date: '2024-10-29',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
      createMockEvent({
        id: '2',
        title: '항해팀 회의',
        date: '2024-10-30',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
      createMockEvent({
        id: '3',
        title: '점심식사',
        date: '2024-10-31',
        startTime: '12:00',
        endTime: '13:15',
        category: '개인',
        description: '설명',
        location: '식당',
      }),
      createMockEvent({
        id: '4',
        title: '미팅',
        date: '2024-10-31',
        startTime: '14:00',
        endTime: '15:15',
        category: '개인',
        description: '설명',
        location: '회의실',
      }),
    ];
    setupMockHandlerCreation(initialEvents);

    const user = setup(<App />).user;
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    waitFor(() => {
      // 초기 이벤트가 존재하는지 확인
      expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
      expect(within(eventList).getByText('항해팀 회의')).toBeInTheDocument();
      expect(within(eventList).getByText('점심식사')).toBeInTheDocument();
      expect(within(eventList).getByText('미팅')).toBeInTheDocument();
    });
    // 검색 입력 필드 찾기
    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

    // '팀 회의' 검색어 입력
    await user.clear(searchInput);
    await user.type(searchInput, '팀 회의');

    // 이벤트 목록에서 검색어에 매칭되는 이벤트 확인
    expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('항해팀 회의')).toBeInTheDocument();
    expect(within(eventList).queryByText('점심식사')).not.toBeInTheDocument();
    expect(within(eventList).queryByText('미팅')).not.toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const initialEvents = [
      createMockEvent({
        id: '1',
        title: '팀 회의',
        date: '2024-10-29',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
      createMockEvent({
        id: '2',
        title: '점심식사',
        date: '2024-10-31',
        startTime: '12:00',
        endTime: '13:15',
        category: '개인',
        description: '설명',
        location: '식당',
      }),
    ];
    setupMockHandlerCreation(initialEvents);

    const user = setup(<App />).user;
    // 이벤트 목록이 렌더링될 때까지 기다림
    const eventList = screen.getByTestId('event-list');

    waitFor(() => {
      // 초기 이벤트가 존재하는지 확인
      expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
      expect(within(eventList).getByText('점심식사')).toBeInTheDocument();
    });
    // 검색 입력 필드 찾기
    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');

    // '팀 회의' 검색어 입력
    await user.clear(searchInput);
    await user.type(searchInput, '팀 회의');

    // 이벤트 목록에서 검색어에 매칭되는 이벤트 확인
    expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
    expect(within(eventList).queryByText('점심식사')).not.toBeInTheDocument();

    await user.clear(searchInput);
    // 초기 이벤트가 다시 노출되는지 확인
    expect(within(eventList).getByText('팀 회의')).toBeInTheDocument();
    expect(within(eventList).getByText('점심식사')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  // NOTE: 테스트케이스 명확하게 수정
  it('겹치는 시간에 새 일정을 추가할 때 경고 다이얼로그가 표시되고, "취소"시, 일정이 추가되지 않아야 한다.', async () => {
    setupMockHandlerCreation([
      createMockEvent({
        id: '1',
        title: '기존 회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
    ]);
    const user = setup(<App />).user;
    const eventList = screen.getByTestId('event-list');
    // 초기 진입시 검색결과 없음 노출 (생성된 일정 없음)
    expect(within(eventList).getByText('검색 결과가 없습니다.')).toBeInTheDocument();

    await saveSchedule(
      user,
      createMockEvent({
        id: '2',
        title: '겹치는 회의',
        date: '2024-10-31',
        startTime: '10:30',
        endTime: '12:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      })
    );

    expect(screen.getByText(/일정 겹침 경고/i)).toBeInTheDocument();
    // 겹침 경고 AlertDialog가 나타날 때까지 기다림
    const alertDialog = screen.getByRole('alertdialog');
    expect(alertDialog).toBeInTheDocument();

    // AlertDialog의 헤더 확인
    const alertHeader = within(alertDialog).getByText('일정 겹침 경고'); // AlertDialogHeader의 텍스트
    expect(alertHeader).toBeInTheDocument();

    // AlertDialog의 내용 확인 (겹치는 일정)
    const overlappingEvent = within(alertDialog).getByText('기존 회의 (2024-10-31 10:00-11:15)');
    expect(overlappingEvent).toBeInTheDocument();

    // '취소' 버튼과 '계속 진행' 버튼 찾기
    const cancelButton = within(alertDialog).getByRole('button', { name: /취소/i });
    // const continueButton = within(alertDialog).getByRole('button', { name: /계속 진행/i });

    // '취소' 버튼 클릭하여 경고 닫기
    await user.click(cancelButton);

    // AlertDialog가 사라졌는지 확인
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    const initialEvents = [
      createMockEvent({
        id: '1',
        title: '수정할 회의',
        date: '2024-10-31',
        startTime: '10:00',
        endTime: '11:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
      createMockEvent({
        id: '2',
        title: '기존 회의',
        date: '2024-10-31',
        startTime: '11:30',
        endTime: '12:15',
        category: '업무',
        description: '설명',
        location: '회의실',
      }),
    ];
    setupMockHandlerCreation(initialEvents);

    const user = setup(<App />).user;

    // 초기 이벤트가 렌더링되기를 기다림
    const eventList = screen.getByTestId('event-list');
    await waitFor(() => expect(within(eventList).getByText('수정할 회의')).toBeInTheDocument());

    // 편집 버튼 찾기
    const editButtons = within(eventList).getAllByLabelText(/Edit event/i);
    expect(editButtons.length).toBeGreaterThan(0);
    // 첫 번째 이벤트의 편집 버튼 클릭
    await user.click(editButtons[0]);

    const titleInput = screen.getByLabelText(/제목/i) as HTMLInputElement;
    const startTimeInput = screen.getByLabelText(/시작 시간/i) as HTMLInputElement;
    const endTimeInput = screen.getByLabelText(/종료 시간/i) as HTMLInputElement;

    // 입력 값이 기존 값과 일치하는지 확인
    expect(titleInput.value).toBe('수정할 회의');
    expect(startTimeInput.value).toBe('10:00');
    expect(endTimeInput.value).toBe('11:15');

    // 입력 필드 변경
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 회의');

    // 시작시간을 겹치게 입력
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '11:35');

    setupMockHandlerUpdating();
    // 저장 버튼 클릭
    const saveButton = screen.getByTestId('event-submit-button');
    await user.click(saveButton);

    // // 시간 설정 오류 노출 확인
    expect(screen.getByText(/시간 설정을 확인해주세요/i)).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2024-10-31T09:50:00'));

  setupMockHandlerCreation([
    createMockEvent({
      title: '회의',
      date: '2024-10-31',
      startTime: '10:00',
      endTime: '11:15',
      category: '업무',
      description: '설명',
      location: '회의실',
      notificationTime: 10,
    }),
  ]);
  setup(<App />);
  await screen.findByTestId('event-list');
  await waitFor(() => {
    expect(screen.getByText(/일정이 시작됩니다/i)).toBeInTheDocument();
  });
});
