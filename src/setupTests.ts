import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

import { handlers } from './__mocks__/handlers';

/* msw */
export const server = setupServer(...handlers);

vi.stubEnv('TZ', 'UTC');

beforeAll(() => {
  server.listen();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

beforeEach(() => {
  expect.hasAssertions();

  vi.setSystemTime(new Date('2024-10-01')); // ? Medium: 왜 이 시간을 설정해주는 걸까요?
  /**
   * A :
   * 테스트에서 사용하는 new Date() 객체가 매번 새로운 인스턴스로 생성되면, 기대한 대로 호출되지 않아 테스트 결과가 매번 달라질 수 있음
   * 이를 해결하기 위해 고정된 날짜를 사용하기 위함.
   */
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  server.close();
});
