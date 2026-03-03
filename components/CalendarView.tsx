'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: { status: string };
}

interface Props {
  events: CalendarEvent[];
}

export default function CalendarView({ events }: Props) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={idLocale}
      headerToolbar={{
        left: 'prev,next',
        center: 'title',
        right: 'today',
      }}
      height="100%"
      dayMaxEvents={2}
      events={events}
      eventContent={(arg) => {
        const color = arg.event.backgroundColor;
        return {
          html: `<div style="background:${color};border-left:3px solid rgba(0,0,0,0.2)" 
                      class="px-1 py-0.5 rounded text-white text-[10px] overflow-hidden whitespace-nowrap text-ellipsis w-full">
                  ${arg.event.title}
                </div>`,
        };
      }}
    />
  );
}
