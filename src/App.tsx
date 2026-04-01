import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TransactionsList } from './components/TransactionsList';
import { POSForm } from './components/POSForm';
import { ClientesMRR } from './components/ClientesMRR';
import { Proyectos } from './components/Proyectos';
import { Deudas } from './components/Deudas';
import { Presupuesto } from './components/Presupuesto';
import { Finanzita } from './components/Finanzita';
import { Login } from './components/Login';

import { FinanceProvider } from './context/FinanceContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PrivateAccessProvider, usePrivateAccessContext } from './context/PrivateAccessContext';


// SM DIGITALS - V1.1.0 - Cloud Sync & Fixed Data
const CLIENT_ID = "939085237274-8ko3328og8njsfsrgptmb04gpos63t6b.apps.googleusercontent.com";

const AppContent = () => {
  const { isUnlocked } = usePrivateAccessContext();


  if (!isUnlocked) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/movimientos" element={<TransactionsList />} />
          <Route path="/pos" element={<POSForm />} />
          <Route path="/clientes" element={<ClientesMRR />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/deudas" element={<Deudas />} />
          <Route path="/presupuesto" element={<Presupuesto />} />
          <Route path="/finanzita" element={<Finanzita />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <PrivateAccessProvider>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </GoogleOAuthProvider>
    </PrivateAccessProvider>
  );
}

export default App;
