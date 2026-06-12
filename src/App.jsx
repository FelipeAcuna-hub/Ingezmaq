import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Layout from './components/layout'; 

// Importación de tus páginas
import Login from './pages/Login';
import RecuperarPassword from './pages/RecuperarPassword';
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

function App() {
  // 🔌 CONEXIÓN REAL: Arrancamos con la sesión vacía (null) para que la busque en Supabase
  const [session, setSession] = useState(null);
  
  // ACTIVADO: Volvemos a poner loading en true para que valide el token antes de dibujar las pantallas
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión inicial guardada en el navegador al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios en tiempo real (Login, Logout, Cierre de Token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("Estado de autenticación cambiado:", _event);
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de carga mientras se verifica la sesión con el servidor
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
        CARGANDO PORTAL INGEZMAQ...
      </div>
    );
  }

  // --- LÓGICA DE ADMINISTRADOR UNIFICADA (LOS 3 CORREOS + ROL) ---
  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com'
  ];

  const isAdmin = 
    session?.user?.app_metadata?.role === 'admin' || 
    ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  return (
    <Router>
      <Routes>
        {/* RUTA PÚBLICA: Si no hay sesión muestra Login, si hay manda al Dashboard */}
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/recuperar-password" 
          element={!session ? <RecuperarPassword /> : <Navigate to="/" />} 
        />
        <Route 
          path="/RecuperarPassword" 
          element={!session ? <RecuperarPassword /> : <Navigate to="/" />} 
        />
        
        {/* --- GRUPO DE RUTAS PROTEGIDAS CON LAYOUT --- */}
        {/* 🛡️ BLINDAJE: Verificamos de forma estricta que exista session y session.user para renderizar el Layout */}
        <Route element={(session && session.user) ? <Layout session={session} /> : <Navigate to="/login" />}>
          
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/perfil" element={<Perfil session={session} />} />
          <Route path="/creditos" element={<Creditos session={session} />} />
          <Route path="/historial" element={<Historial session={session} />} />
          <Route path="/tickets" element={<Tickets session={session} />} />
          <Route path="/archivos" element={<Archivos session={session} />} />
          <Route path="/upload" element={<UploadFile session={session} />} />
          <Route path="/simulador" element={<Simulador session={session} />} />
          <Route path="/clientes" element={<Clientes session={session} />} />
          
          {/* Ruta Exclusiva para Administradores */}
          <Route 
            path="/admin" 
            element={isAdmin ? <Admin session={session} /> : <Navigate to="/" />} 
          />

        </Route>
        {/* --- FIN DEL GRUPO CON LAYOUT --- */}

        {/* Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;