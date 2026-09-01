import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Layout from './components/layout';

// Importación de tus páginas
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
import ActualizarPassword from './pages/ActualizarPassword'; // 👈 Asegúrate de que esté importado
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import Creditos from './pages/Creditos';
import Historial from './pages/Historial';
import Tickets from './pages/Tickets';
import Archivos from './pages/Archivos';
import Admin from './pages/Admin';
import UploadFile from './pages/UploadFile';
import Simulador from './pages/Simulador';
import Clientes from './pages/Clientes';
import PendingApproval from './pages/PendingApproval';

function App() {
  const [session, setSession] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔒 Verifica sesión Y aprobación del admin en cada carga/cambio de sesión,
  // no solo al enviar el formulario de login. Sin esto, cualquiera con una
  // sesión guardada (aunque nunca lo hayan aprobado) entraba igual al
  // recargar la página. Si no está aprobado, la sesión se mantiene (no se
  // cierra) para poder mostrarle la pantalla de espera en vez de rebotarlo
  // al login sin explicación.
  useEffect(() => {
    let active = true;

    const applySession = async (currentSession) => {
      if (!active) return;
      setSession(currentSession);

      if (currentSession?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('id', currentSession.user.id)
          .single();

        if (!active) return;

        setIsApproved(!error && !!data?.is_approved);
      } else {
        setIsApproved(false);
      }

      if (active) setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("Estado de autenticación cambiado:", _event);
      applySession(currentSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        letterSpacing: '1px'
      }}>
        CARGANDO PORTAL CHIPTUNING...
      </div>
    );
  }

  const hasAccess = !!(session && session.user && isApproved);
  const pendingApproval = !!(session && session.user && !isApproved);

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  ];

  // Acceso a /clientes: los administradores completos, más los que solo
  // gestionan clientes (aprobar/rechazar/eliminar) sin ser admin general.
  const CLIENTES_ACCESS_EMAILS = [...ADMIN_EMAILS, 'alientechchile@gmail.com'];

  const isAdmin =
    session?.user?.app_metadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  const canAccessClientes = CLIENTES_ACCESS_EMAILS.includes(session?.user?.email?.toLowerCase());

  return (
    <Router>
      <Routes>
        {/* --- RUTAS PÚBLICAS / INDEPENDIENTES (SIN LAYOUT) --- */}
        {/* Si ya hay sesión (aprobada o pendiente), no tiene sentido mostrar
            el formulario de login: se manda a "/", que decide qué mostrar. */}
        <Route
          path="/login"
          element={(hasAccess || pendingApproval) ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/recuperar-password"
          element={(hasAccess || pendingApproval) ? <Navigate to="/" /> : <RecuperarPassword />}
        />
        <Route
          path="/RecuperarPassword"
          element={(hasAccess || pendingApproval) ? <Navigate to="/" /> : <RecuperarPassword />}
        />

        {/* 🚀 RUTA INDEPENDIENTE: Pantalla limpia de Actualizar Contraseña */}
        <Route
          path="/actualizar-password"
          element={<ActualizarPassword session={session} />}
        />

        {/* --- GRUPO DE RUTAS PROTEGIDAS CON LAYOUT --- */}
        <Route element={
          hasAccess ? <Layout session={session} />
            : pendingApproval ? <PendingApproval email={session?.user?.email} />
              : <Navigate to="/login" />
        }>

          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/perfil" element={<Perfil session={session} />} />
          <Route path="/creditos" element={<Creditos session={session} />} />
          <Route path="/historial" element={<Historial session={session} />} />
          <Route path="/tickets" element={<Tickets session={session} />} />
          <Route path="/archivos" element={<Archivos session={session} />} />
          <Route path="/upload" element={<UploadFile session={session} />} />
          <Route path="/simulador" element={<Simulador session={session} />} />
          <Route path="/clientes" element={canAccessClientes ? <Clientes session={session} /> : <Navigate to="/" />} />

          {/* Ruta Exclusiva para Administradores */}
          <Route
            path="/admin"
            element={isAdmin ? <Admin session={session} /> : <Navigate to="/" />}
          />

        </Route>
        {/* --- FIN DEL GRUPO CON LAYOUT --- */}

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
