import { Event, EventForm, RepeatInfo } from '../types';

type Params = {
  editingEvent: Event | null;
  isRepeating: boolean;
  repeatType: RepeatInfo['type'];
  repeatInterval: RepeatInfo['interval'];
  repeatEndDate?: RepeatInfo['endDate'];
} & Omit<EventForm, 'repeat'>;

export const prepareEventData = ({
  editingEvent,
  title,
  date,
  startTime,
  endTime,
  description,
  location,
  category,
  isRepeating,
  repeatType,
  repeatInterval,
  repeatEndDate,
  notificationTime,
}: Params): Event | EventForm => {
  return {
    id: editingEvent ? editingEvent.id : undefined,
    title,
    date,
    startTime,
    endTime,
    description,
    location,
    category,
    repeat: {
      type: isRepeating ? repeatType : 'none',
      interval: isRepeating && repeatInterval ? repeatInterval : 1,
      endDate: isRepeating && repeatEndDate ? repeatEndDate : undefined,
    },
    notificationTime,
  };
};
