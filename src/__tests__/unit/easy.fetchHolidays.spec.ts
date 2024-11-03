import { fetchHolidays } from '../../apis/fetchHolidays';

describe('fetchHolidays', () => {
  it('주어진 월의 공휴일만 반환한다', () => {
    const date = new Date('2024-02-15'); // 2024년 2월
    const expected = {
      '2024-02-09': '설날',
      '2024-02-10': '설날',
      '2024-02-11': '설날',
    };
    const result = fetchHolidays(date);
    expect(result).toEqual(expected);
  });

  it('공휴일이 없는 월에 대해 빈 객체를 반환한다', () => {
    const date = new Date('2024-11-04'); // 2024년 4월 (공휴일 없음)
    const expected = {};
    const result = fetchHolidays(date);
    expect(result).toEqual(expected);
  });

  it('여러 공휴일이 있는 월에 대해 모든 공휴일을 반환한다', () => {
    const date = new Date('2024-09-10'); // 2024년 9월
    const expected = {
      '2024-09-16': '추석',
      '2024-09-17': '추석',
      '2024-09-18': '추석',
    };
    const result = fetchHolidays(date);
    expect(result).toEqual(expected);
  });
});
