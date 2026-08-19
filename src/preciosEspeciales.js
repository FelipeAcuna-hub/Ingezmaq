// Precios fijos para clientes especiales (profiles.cliente_especial = true),
// solo en estos servicios puntuales. El resto de los servicios no se ve afectado.
export const PRECIOS_ESPECIALES = {
  dpf_only: 6,   // DPF OFF
  egr_only: 6,   // EGR OFF
  dpf_egr: 8,    // DPF OFF + EGR OFF
  adblue_full: 10 // ADBLUE + DPF & EGR OFF
};

export function precioServicio(servicioId, precioBase, esClienteEspecial) {
  if (esClienteEspecial && PRECIOS_ESPECIALES[servicioId] != null) {
    return PRECIOS_ESPECIALES[servicioId];
  }
  return precioBase;
}
