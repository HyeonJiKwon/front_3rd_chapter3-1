import { useToast } from '@chakra-ui/react';

import { EventForm } from '../types';

interface ErrorProps {
  startTimeError: string | null;
  endTimeError: string | null;
}
type EventFormProps = Pick<EventForm, 'title' | 'date' | 'startTime' | 'endTime'>;

const useEventValidation = () => {
  const toast = useToast();

  const validate = ({
    title,
    date,
    startTime,
    endTime,
    startTimeError,
    endTimeError,
  }: EventFormProps & ErrorProps) => {
    if (!title || !date || !startTime || !endTime) {
      toast({
        title: '필수 정보를 모두 입력해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (startTimeError || endTimeError) {
      toast({
        title: '시간 설정을 확인해주세요.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  return { validate };
};

export default useEventValidation;
