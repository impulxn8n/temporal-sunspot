const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export const getOrCreateFinanceCalendar = async (accessToken: string) => {
  const calendarsResponse = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await calendarsResponse.json();
  const existing = data.items?.find((c: any) => c.summary === 'Pagos Finanzita');

  if (existing) return existing.id;

  const createResponse = await fetch(`${GOOGLE_CALENDAR_API}/calendars`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ summary: 'Pagos Finanzita' }),
  });
  const newCalendar = await createResponse.json();
  return newCalendar.id;
};

export const createPaymentEvent = async (
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description: string;
    date: string;
    amount: number;
    recurrence?: string[];
  }
) => {
  const startDateStr = new Date(event.date).toISOString().split('T')[0];
  const endDate = new Date(event.date);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split('T')[0];

  const eventBody: any = {
    summary: `💰 ${event.summary}`,
    description: `${event.description}\n\nMonto: $${event.amount.toLocaleString('es-CO')}`,
    start: {
      date: startDateStr,
    },
    end: {
      date: endDateStr,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 60 },   // 1h before starting day
      ],
    },
  };

  if (event.recurrence) {
    eventBody.recurrence = event.recurrence;
  }

  const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  return response.json();
};

export const deleteFinanceCalendar = async (accessToken: string) => {
  const calendarsResponse = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await calendarsResponse.json();
  const existing = data.items?.find((c: any) => c.summary === 'Pagos Finanzita');

  if (existing) {
    await fetch(`${GOOGLE_CALENDAR_API}/calendars/${existing.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return true;
  }
  return false;
};
