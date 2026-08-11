export interface BoldSale {
  id: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  paymentMethod?: string;
}

export const getBoldConfig = () => {
  const merchantId = import.meta.env.VITE_BOLD_MERCHANT_ID || localStorage.getItem('bold_merchant_id') || 'D2MS4BR54A';
  const apiKey = import.meta.env.VITE_BOLD_API_KEY || localStorage.getItem('bold_api_key') || '5XUFm_dariBlA90dwrPq8C8DVh1fpvEJsIAuhRAl4PM';
  const secretKey = import.meta.env.VITE_BOLD_SECRET_KEY || localStorage.getItem('bold_secret_key') || '-4qB49nLtb_ze5CTy35pZA';
  return { merchantId, apiKey, secretKey };
};

export const saveBoldConfig = (merchantId: string, apiKey: string, secretKey: string) => {
  localStorage.setItem('bold_merchant_id', merchantId);
  localStorage.setItem('bold_api_key', apiKey);
  localStorage.setItem('bold_secret_key', secretKey);
};
