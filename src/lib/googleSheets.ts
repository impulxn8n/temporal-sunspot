const GOOGLE_SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export const createFinanceSpreadsheet = async (accessToken: string, title: string) => {
  const body = {
    properties: {
      title: title,
    },
    sheets: [
      { properties: { title: 'Movimientos' } },
      { properties: { title: 'Clientes_MRR' } },
      { properties: { title: 'Proyectos' } },
      { properties: { title: 'Deudas' } },
      { properties: { title: 'Presupuestos' } },
    ],
  };

  const response = await fetch(GOOGLE_SHEETS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Error creating spreadsheet');
  }

  const data = await response.json();
  return data.spreadsheetId;
};

export const updateSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
) => {
  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Error updating sheet values');
  }

  return response.json();
};

export const getSpreadsheetIdByName = async (accessToken: string, name: string) => {
  // Use Drive API to search for the file by name
  const url = `https://www.googleapis.com/drive/v3/files?q=name='${name}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  const data = await response.json();
  return data.files?.[0]?.id || null;
};
