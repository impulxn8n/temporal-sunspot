import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://chczqgbxwykxnjfjcsax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoY3pxZ2J4d3lreG5qZmpjc2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjUyNjksImV4cCI6MjA5NDI0MTI2OX0.mRBd5gWpwPBlAhRvxhiYqoMbi7TX-BFhck16n5lHCKc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
