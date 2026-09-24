import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  RefreshCw,
  TrendingUp,
  Gift,
  Building2,
  Mail,
  ShieldCheck,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlusCircle,
  CreditCard,
  Search
} from 'lucide-react';

const Historial = ({ session }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { darkMode } = useOutletContext(); 

  const [pagMovimientos, setPagMovimientos] = useState(1);
  const [pagCanjes, setPagCanjes] = useState(1);
  const [searchMovimientos, setSearchMovimientos] = useState('');
  const [searchCanjes, setSearchCanjes] = useState('');
  const itemsPorPagina = 4;

  const ADMIN_EMAILS = [
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  ];

  const isAdmin =
    session?.user?.user_metadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase());

  // --- FUNCIÓN DE CARGA DE DATOS ---
  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;

      console.log("=== INICIANDO FETCH DE HISTORIAL DE CRÉDITOS ===");

      // 1. CONSULTA A TABLA 'movimientos'
      let queryMovs = supabase
        .from('movimientos')
        .select('*, profiles(company, email, credits)')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        queryMovs = queryMovs.eq('user_id', session?.user?.id);
      }

      // 2. CONSULTA A TABLA 'historial_movimientos'
      let queryCanjes = supabase
        .from('historial_movimientos')
        .select('*, profiles(company, email, credits)')
        .order('fecha', { ascending: false });

      if (!isAdmin) {
        queryCanjes = queryCanjes.eq('perfil_id', session?.user?.id);
      }

      // 3. CONSULTA A TABLA 'archivos': muchos canjes vienen de fuera de esta
      // app (no traen el campo "servicio" propio) y no tienen el detalle en
      // su descripción, pero el servicio SÍ quedó guardado en la solicitud
      // de archivos correspondiente (detalles_tecnicos.servicios_solicitados).
      let queryArchivos = supabase
        .from('archivos')
        .select('user_id, patente, created_at, detalles_tecnicos');

      if (!isAdmin) {
        queryArchivos = queryArchivos.eq('user_id', session?.user?.id);
      }

      const [resMovs, resCanjes, resArchivos] = await Promise.all([queryMovs, queryCanjes, queryArchivos]);

      if (resMovs.error) {
        console.error("Error en tabla 'movimientos':", resMovs.error);
      }
      if (resCanjes.error) {
        console.error("Error en tabla 'historial_movimientos':", resCanjes.error);
      }
      if (resArchivos.error) {
        console.error("Error en tabla 'archivos':", resArchivos.error);
      }

      setMovimientos(resMovs.data || []);
      setCanjes(resCanjes.data || []);
      setArchivos(resArchivos.data || []);

    } catch (error) {
      console.error("Error crítico cargando historiales:", error.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, isAdmin]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDatos();
    }
  }, [session?.user?.id, fetchDatos]);

  // Muchos canjes no tienen el campo "servicio" propio ni lo traen en el
  // texto de "descripcion" (varios se generan por fuera de esta app). Como
  // respaldo, se busca la solicitud en "archivos" del mismo cliente y misma
  // patente más cercana en el tiempo, y se usa el servicio guardado ahí
  // (el mismo que aparece en "Services" al ver el detalle del archivo).
  const serviciosPorCanje = useMemo(() => {
    const mapa = {};
    for (const c of canjes) {
      if (c.servicio) { mapa[c.id] = c.servicio; continue; }

      const partesDescripcion = c.descripcion?.split(' - ');
      if (partesDescripcion && partesDescripcion.length > 1) {
        mapa[c.id] = partesDescripcion[partesDescripcion.length - 1];
        continue;
      }

      const patenteMatch = c.descripcion?.match(/\(([^)]+)\)/);
      const patente = patenteMatch ? patenteMatch[1] : null;
      const fechaCanje = new Date(c.fecha).getTime();

      const candidatos = archivos.filter(a => a.user_id === c.perfil_id && (!patente || a.patente === patente));
      let mejor = null;
      let mejorDiferencia = Infinity;
      for (const a of candidatos) {
        const diferencia = Math.abs(new Date(a.created_at).getTime() - fechaCanje);
        if (diferencia < mejorDiferencia) {
          mejorDiferencia = diferencia;
          mejor = a;
        }
      }

      mapa[c.id] = mejor?.detalles_tecnicos?.servicios_solicitados || '-';
    }
    return mapa;
  }, [canjes, archivos]);

  const obtenerServicio = (c) => serviciosPorCanje[c.id] || '-';

  // Buscador: por empresa, correo, detalle/descripción, quién lo realizó,
  // servicio, o la fecha (escrita como "24-09", "24/09/2026", "2026-09-24", etc).
  const coincideTexto = (texto, term) => (texto || '').toLowerCase().includes(term);
  const coincideFecha = (fechaIso, term) => {
    const d = new Date(fechaIso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    const variantes = [
      `${dd}-${mm}-${yyyy}`, `${dd}/${mm}/${yyyy}`,
      `${yyyy}-${mm}-${dd}`, `${dd}-${mm}`, `${dd}/${mm}`
    ];
    return variantes.some(v => v.includes(term));
  };

  const movimientosFiltrados = useMemo(() => {
    const term = searchMovimientos.trim().toLowerCase();
    if (!term) return movimientos;
    return movimientos.filter(m =>
      coincideTexto(m.profiles?.company, term) ||
      coincideTexto(m.profiles?.email, term) ||
      coincideTexto(m.descripcion, term) ||
      coincideTexto(m.admin_email || 'Sistema', term) ||
      coincideFecha(m.created_at, term)
    );
  }, [movimientos, searchMovimientos]);

  const canjesFiltrados = useMemo(() => {
    const term = searchCanjes.trim().toLowerCase();
    if (!term) return canjes;
    return canjes.filter(c =>
      coincideTexto(c.profiles?.company, term) ||
      coincideTexto(c.profiles?.email, term) ||
      coincideTexto(c.descripcion, term) ||
      coincideTexto(obtenerServicio(c), term) ||
      coincideFecha(c.fecha, term)
    );
  }, [canjes, searchCanjes, serviciosPorCanje]);

  const totalPagMovs = Math.ceil(movimientosFiltrados.length / itemsPorPagina);
  const movsPaginados = movimientosFiltrados.slice((pagMovimientos - 1) * itemsPorPagina, pagMovimientos * itemsPorPagina);

  const totalPagCanjes = Math.ceil(canjesFiltrados.length / itemsPorPagina);
  const canjesPaginados = canjesFiltrados.slice((pagCanjes - 1) * itemsPorPagina, pagCanjes * itemsPorPagina);

  // Saldo antes y después de CADA recarga/canje: se arma una sola línea de
  // tiempo por cliente (recargas + canjes mezclados), y se calcula hacia
  // atrás partiendo del saldo real actual (profiles.credits) — así el evento
  // más reciente siempre calza exacto con lo que el cliente tiene hoy, sin
  // depender de que cada canje antiguo haya descontado bien.
  const saldoPorEvento = useMemo(() => {
    const eventos = [
      ...movimientos.map(m => ({
        key: `mov-${m.id}`,
        userId: m.user_id,
        fecha: new Date(m.created_at).getTime(),
        delta: m.tipo === 'gasto' ? -m.cantidad : m.cantidad,
        credits: m.profiles?.credits
      })),
      ...canjes.map(c => ({
        key: `canje-${c.id}`,
        userId: c.perfil_id,
        fecha: new Date(c.fecha).getTime(),
        delta: -c.cantidad,
        credits: c.profiles?.credits
      }))
    ];

    const porUsuario = {};
    for (const e of eventos) {
      (porUsuario[e.userId] ||= []).push(e);
    }

    const resultado = {};
    for (const userId of Object.keys(porUsuario)) {
      const lista = porUsuario[userId].slice().sort((a, b) => b.fecha - a.fecha);
      let saldo = lista[0]?.credits ?? 0;
      for (const e of lista) {
        resultado[e.key] = { despues: saldo, antes: saldo - e.delta };
        saldo -= e.delta;
      }
    }
    return resultado;
  }, [movimientos, canjes]);

  const tokens = {
    bg: darkMode ? '#0f172a' : '#f6f6f9',               
    surface: darkMode ? '#1e293b' : '#ffffff',          
    ink: darkMode ? '#f8fafc' : '#18181b',              
    inkSoft: darkMode ? '#94a3b8' : '#71717a',          
    inkFaint: darkMode ? '#64748b' : '#a1a1aa',         
    line: darkMode ? '#334155' : '#ececf0',             
    brand: '#e11d48',                                   
    brandSoft: darkMode ? 'rgba(225, 29, 72, 0.15)' : '#fff1f3',
    brandLine: darkMode ? 'rgba(225, 29, 72, 0.3)' : '#ffd7df',
    positive: darkMode ? '#4ade80' : '#15803d',         
    positiveSoft: darkMode ? 'rgba(74, 222, 128, 0.15)' : '#f0fdf4',
    positiveLine: darkMode ? 'rgba(74, 222, 128, 0.3)' : '#bbf7d0',
    negativeSoft: darkMode ? 'rgba(225, 29, 72, 0.15)' : '#fff1f3',
    primary: '#2563eb',
    primarySoft: darkMode ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
    primaryLine: darkMode ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
  };

  const styles = {
    mainContent: {
      flex: 1,
      padding: '0',
      backgroundColor: tokens.bg,
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: 'all 0.3s ease'
    },
    bannerCargar: {
      backgroundColor: tokens.surface,
      margin: '28px 30px 0',
      padding: '24px 30px',
      borderRadius: '16px',
      border: `1px solid ${tokens.line}`,
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 1px 2px rgba(24,24,27,0.04), 0 8px 24px rgba(24,24,27,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      transition: 'all 0.3s ease'
    },
    bannerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    bannerTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: tokens.ink,
      margin: 0,
      letterSpacing: '-0.01em'
    },
    bannerSubtitle: {
      fontSize: '12.5px',
      color: tokens.inkSoft,
      margin: '3px 0 0'
    },
    bannerBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: tokens.primary,
      color: '#ffffff',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      textDecoration: 'none',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    card: {
      backgroundColor: tokens.surface,
      margin: '28px 30px',
      padding: '32px 34px 28px',
      borderRadius: '16px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 1px 2px rgba(24,24,27,0.04), 0 8px 24px rgba(24,24,27,0.04)',
      border: `1px solid ${tokens.line}`,
      minHeight: '200px',
      transition: 'all 0.3s ease'
    },
    headerFlex: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '22px',
      paddingBottom: '18px',
      borderBottom: `1px solid ${tokens.line}`
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: darkMode ? '#0f172a' : '#f6f6f9',
      border: `1px solid ${tokens.line}`,
      borderRadius: '9px',
      padding: '8px 12px',
      width: '220px'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontSize: '12.5px',
      width: '100%',
      color: tokens.ink
    },
    titleGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
    iconBadge: (color, soft) => ({
      width: '38px',
      height: '38px',
      borderRadius: '11px',
      backgroundColor: soft,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }),
    tituloSeccion: {
      fontSize: '17px',
      margin: 0,
      color: tokens.ink,
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    subTitulo: {
      fontSize: '12.5px',
      color: tokens.inkFaint,
      margin: '2px 0 0',
      fontWeight: 500
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      textAlign: 'left',
      padding: '0 12px 12px',
      fontSize: '10.5px',
      color: tokens.inkFaint,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 700,
      borderBottom: `1px solid ${tokens.line}`,
      paddingBottom: '12px'
    },
    td: {
      padding: '16px 12px',
      borderBottom: `1px solid ${tokens.line}`,
      fontSize: '13.5px',
      color: tokens.ink
    },
    row: {
      transition: 'background-color 0.15s ease'
    },
    refreshBtn: (isLoading) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      backgroundColor: isLoading ? (darkMode ? '#334155' : '#27272a') : (darkMode ? '#2563eb' : tokens.ink),
      color: '#fff',
      border: 'none',
      padding: '9px 16px',
      borderRadius: '9px',
      fontSize: '12px',
      fontWeight: 600,
      cursor: isLoading ? 'default' : 'pointer',
      transition: 'transform 0.12s ease, opacity 0.2s ease, background-color 0.2s ease',
      opacity: isLoading ? 0.75 : 1
    }),
    badge: (color, soft, border) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: soft,
      color: color,
      border: `1px solid ${border}`,
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '11.5px',
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }),
    emailPill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      color: tokens.inkSoft,
      fontSize: '12px',
      marginTop: '4px'
    },
    adminBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      backgroundColor: darkMode ? '#0f172a' : '#fafafa',
      padding: '4px 9px',
      borderRadius: '7px',
      fontSize: '11px',
      color: tokens.inkSoft,
      border: `1px solid ${tokens.line}`
    },
    fecha: { fontWeight: 600, color: tokens.ink },
    hora: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: tokens.inkFaint,
      fontSize: '11px',
      marginTop: '3px'
    },
    montoPositivo: {
      textAlign: 'right',
      fontWeight: 700,
      color: tokens.positive,
      fontVariantNumeric: 'tabular-nums'
    },
    montoNegativo: {
      textAlign: 'right',
      fontWeight: 700,
      color: tokens.brand,
      fontVariantNumeric: 'tabular-nums'
    },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '22px' },
    pageBtn: (active) => ({
      minWidth: '30px',
      height: '30px',
      padding: '0 8px',
      cursor: 'pointer',
      backgroundColor: active ? (darkMode ? '#2563eb' : tokens.ink) : 'transparent',
      color: active ? '#fff' : tokens.inkSoft,
      border: active ? `1px solid ${darkMode ? '#2563eb' : tokens.ink}` : `1px solid ${tokens.line}`,
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 700,
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }),
    navBtn: (disabled) => ({
      width: '30px',
      height: '30px',
      cursor: disabled ? 'default' : 'pointer',
      backgroundColor: 'transparent',
      color: disabled ? (darkMode ? '#334155' : '#d4d4d8') : tokens.inkSoft,
      border: `1px solid ${tokens.line}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease'
    }),
    emptyState: {
      textAlign: 'center',
      color: tokens.inkFaint,
      padding: '48px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px'
    },
    skeletonRow: {
      height: '20px',
      borderRadius: '6px',
      background: `linear-gradient(90deg, ${tokens.line} 25%, ${darkMode ? '#1e293b' : '#f4f4f6'} 37%, ${tokens.line} 63%)`,
      backgroundSize: '400% 100%',
      animation: 'histShimmer 1.4s ease infinite'
    }
  };

  const renderPagination = (current, total, setPage) => (
    total > 1 && (
      <div style={styles.pagination}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={current === 1}
          style={styles.navBtn(current === 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>
        {[...Array(total).keys()].map(n => (
          <button key={n + 1} onClick={() => setPage(n + 1)} style={styles.pageBtn(current === n + 1)}>
            {n + 1}
          </button>
        ))}
        <button
          onClick={() => setPage(p => Math.min(total, p + 1))}
          disabled={current === total}
          style={styles.navBtn(current === total)}
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    )
  );

  const renderSkeletonRows = (cols) => (
    [...Array(3).keys()].map(i => (
      <tr key={`sk-${i}`}>
        {[...Array(cols).keys()].map(c => (
          <td key={c} style={styles.td}>
            <div style={{ ...styles.skeletonRow, width: c === cols - 1 ? '60px' : '80%', marginLeft: c === cols - 1 ? 'auto' : 0 }} />
          </td>
        ))}
      </tr>
    ))
  );

  return (
    <div style={styles.mainContent}>
      <style>{`
        @keyframes histShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes histFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hist-row {
          animation: histFadeIn 0.25s ease both;
        }
        .hist-row:hover {
          background-color: ${darkMode ? '#334155' : '#fafafa'} !important;
        }
        .hist-refresh-btn:not(:disabled):hover {
          transform: translateY(-1px);
        }
        .hist-refresh-icon-spin {
          animation: histSpin 0.8s linear infinite;
        }
        .hist-banner-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        @keyframes histSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* BANNER DE ACCESO RÁPIDO PARA COMPRA DE CRÉDITOS */}
      <div style={styles.bannerCargar}>
        <div style={styles.bannerInfo}>
          <div style={styles.iconBadge(tokens.primary, tokens.primarySoft)}>
            <CreditCard size={18} strokeWidth={2.3} />
          </div>
          <div>
            <h2 style={styles.bannerTitle}>¿Necesitas más créditos?</h2>
            <p style={styles.bannerSubtitle}>Carga saldo a tu cuenta de forma inmediata y continúa procesando tus archivos.</p>
          </div>
        </div>
        <Link to="/creditos" className="hist-banner-btn" style={styles.bannerBtn}>
          <PlusCircle size={15} />
          CARGAR CRÉDITOS
        </Link>
      </div>

      {/* --- SECCIÓN 1: RECARGAS (Tabla movimientos) --- */}
      <div style={styles.card}>
        <div style={styles.headerFlex}>
          <div style={styles.titleGroup}>
            <div style={styles.iconBadge(tokens.positive, tokens.positiveSoft)}>
              <TrendingUp size={18} strokeWidth={2.3} />
            </div>
            <div>
              <h2 style={styles.tituloSeccion}>
                {isAdmin ? "Gestión global de recargas" : "Mi historial de créditos"}
              </h2>
              <p style={styles.subTitulo}>
                {movimientosFiltrados.length} {movimientosFiltrados.length === 1 ? 'registro' : 'registros'}
                {searchMovimientos.trim() && ` de ${movimientos.length}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={styles.searchBar}>
              <Search size={14} style={{ color: tokens.inkFaint, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar por día, empresa, correo..."
                value={searchMovimientos}
                onChange={(e) => { setSearchMovimientos(e.target.value); setPagMovimientos(1); }}
                style={styles.searchInput}
              />
            </div>
            <button
              className="hist-refresh-btn"
              onClick={fetchDatos}
              disabled={loading}
              style={styles.refreshBtn(loading)}
            >
              <RefreshCw size={13} className={loading ? 'hist-refresh-icon-spin' : ''} />
              {loading ? 'Cargando' : 'Actualizar'}
            </button>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              {isAdmin && <th style={styles.th}>Empresa / Cliente</th>}
              <th style={styles.th}>Descripción</th>
              <th style={styles.th}>Realizado por</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Cantidad</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Saldo antes</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Saldo después</th>
            </tr>
          </thead>
          <tbody>
            {loading && movimientos.length === 0
              ? renderSkeletonRows(isAdmin ? 5 : 4)
              : movsPaginados.map((m, i) => {
                const dateObj = new Date(m.created_at);
                const saldo = saldoPorEvento[`mov-${m.id}`];
                return (
                  <tr key={m.id} className="hist-row" style={{ ...styles.row, animationDelay: `${i * 30}ms` }}>
                    <td style={styles.td}>
                      <span style={styles.fecha}>
                        {dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      <div style={styles.hora}>
                        <Clock size={10} />
                        {dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                      </div>
                    </td>
                    {isAdmin && (
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={styles.badge(tokens.brand, tokens.brandSoft, tokens.brandLine)}>
                            <Building2 size={11} />
                            {m.profiles?.company || 'PARTICULAR'}
                          </span>
                          <span style={styles.emailPill}>
                            <Mail size={12} />
                            {m.profiles?.email || '—'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td style={{ ...styles.td, color: tokens.inkSoft }}>{m.descripcion}</td>
                    <td style={styles.td}>
                      <span style={styles.adminBadge}>
                        <ShieldCheck size={11} />
                        {m.admin_email || 'Sistema'}
                      </span>
                    </td>
                    <td style={m.tipo === 'gasto' ? styles.montoNegativo : styles.montoPositivo}>
                      {m.tipo === 'gasto' ? '-' : '+'}{m.cantidad.toLocaleString('es-CL')}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', color: tokens.inkFaint }}>
                      {(saldo?.antes ?? 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: tokens.ink }}>
                      {(saldo?.despues ?? 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {renderPagination(pagMovimientos, totalPagMovs, setPagMovimientos)}
        {!loading && movimientosFiltrados.length === 0 && (
          <div style={styles.emptyState}>
            <Inbox size={26} strokeWidth={1.6} />
            <span>{searchMovimientos.trim() ? 'No hay resultados para esa búsqueda.' : 'No hay registros disponibles.'}</span>
          </div>
        )}
      </div>

      {/* --- SECCIÓN 2: CANJES (Tabla historial_movimientos) --- */}
      <div style={styles.card}>
        <div style={styles.headerFlex}>
          <div style={styles.titleGroup}>
            <div style={styles.iconBadge(tokens.brand, tokens.brandSoft)}>
              <Gift size={18} strokeWidth={2.3} />
            </div>
            <div>
              <h2 style={styles.tituloSeccion}>
                {isAdmin ? "Gestión global de canjes" : "Mis canjes de archivos realizados"}
              </h2>
              <p style={styles.subTitulo}>
                {canjesFiltrados.length} {canjesFiltrados.length === 1 ? 'registro' : 'registros'}
                {searchCanjes.trim() && ` de ${canjes.length}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={styles.searchBar}>
              <Search size={14} style={{ color: tokens.inkFaint, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar por día, empresa, correo, servicio..."
                value={searchCanjes}
                onChange={(e) => { setSearchCanjes(e.target.value); setPagCanjes(1); }}
                style={styles.searchInput}
              />
            </div>
            <button
              className="hist-refresh-btn"
              onClick={fetchDatos}
              disabled={loading}
              style={styles.refreshBtn(loading)}
            >
              <RefreshCw size={13} className={loading ? 'hist-refresh-icon-spin' : ''} />
              {loading ? 'Cargando' : 'Actualizar'}
            </button>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              {isAdmin && <th style={styles.th}>Empresa / Cliente</th>}
              <th style={styles.th}>Detalle</th>
              <th style={styles.th}>Servicio</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Cantidad</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Saldo antes</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Saldo después</th>
            </tr>
          </thead>
          <tbody>
            {loading && canjes.length === 0
              ? renderSkeletonRows(isAdmin ? 4 : 3)
              : canjesPaginados.map((c, i) => {
                const fechaObj = new Date(c.fecha);
                const saldo = saldoPorEvento[`canje-${c.id}`];
                return (
                  <tr key={c.id} className="hist-row" style={{ ...styles.row, animationDelay: `${i * 30}ms` }}>
                    <td style={styles.td}>
                      <div style={styles.fecha}>
                        {fechaObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                      <div style={styles.hora}>
                        <Clock size={10} />
                        {fechaObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                      </div>
                    </td>

                    {isAdmin && (
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={styles.badge(tokens.brand, tokens.brandSoft, tokens.brandLine)}>
                            <Building2 size={11} />
                            {c.profiles?.company || 'PARTICULAR'}
                          </span>
                          <span style={styles.emailPill}>
                            <Mail size={12} />
                            {c.profiles?.email || '—'}
                          </span>
                        </div>
                      </td>
                    )}

                    <td style={{ ...styles.td, color: tokens.inkSoft }}>{c.descripcion}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(tokens.brand, tokens.brandSoft, tokens.brandLine)}>
                        {obtenerServicio(c)}
                      </span>
                    </td>
                    <td style={styles.montoNegativo}>
                      -{c.cantidad.toLocaleString('es-CL')}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', color: tokens.inkFaint }}>
                      {(saldo?.antes ?? 0).toLocaleString('es-CL')}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: tokens.ink }}>
                      {(saldo?.despues ?? 0).toLocaleString('es-CL')}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {renderPagination(pagCanjes, totalPagCanjes, setPagCanjes)}
        {!loading && canjesFiltrados.length === 0 && (
          <div style={styles.emptyState}>
            <Inbox size={26} strokeWidth={1.6} />
            <span>{searchCanjes.trim() ? 'No hay resultados para esa búsqueda.' : 'No hay canjes registrados.'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;