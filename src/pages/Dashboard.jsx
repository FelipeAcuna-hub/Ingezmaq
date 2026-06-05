import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ session }) => {
  // Datos locales estáticos para el mockup de Ingezmaq
  const [stats, setStats] = useState({
    equiposActivos: 12,
    ticketsPendientes: 3,
    archivosProcesados: 148,
    creditosDisponibles: 150000
  });

  const styles = {
    container: {
      padding: '30px',
      backgroundColor: '#f3f4f6',
      minHeight: '100%',
      fontFamily: 'sans-serif'
    },
    welcomeCard: {
      backgroundColor: '#fff',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    card: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    cardTitle: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: '8px'
    },
    cardValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    accentText: {
      color: '#2563eb', // Azul Ingezmaq
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.container}>
      {/* Tarjeta de Bienvenida */}
      <div style={styles.welcomeCard}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#1f2937' }}>
          ¡Bienvenido al Panel de <span style={styles.accentText}>Ingezmaq</span>!
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '14px' }}>
          Configuración inicial exitosa. Desde aquí podrás gestionar tus equipos, revisar archivos y controlar los tickets del sistema.
        </p>
      </div>

      {/* Grid de Estadísticas Globales */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>⚙️ Equipos en Monitoreo</div>
          <div style={styles.cardValue}>{stats.equiposActivos}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>💬 Tickets Abiertos</div>
          <div style={styles.cardValue} style={{...styles.cardValue, color: '#dc2626'}}>{stats.ticketsPendientes}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>📄 Archivos Procesados</div>
          <div style={styles.cardValue}>{stats.archivosProcesados}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>💰 Saldo CLP</div>
          <div style={styles.cardValue}>${stats.creditosDisponibles.toLocaleString('es-CL')}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;