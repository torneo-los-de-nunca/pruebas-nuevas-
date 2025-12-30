import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "LDN_HISTORICO_V1";

// ✅ mismos meses que Home (misma cabecera de tabla)
export const MESES_HOME = [
  { nombre: "DICIEMBRE", desde: 1, hasta: 4 },
  { nombre: "ENERO", desde: 5, hasta: 9 },
  { nombre: "FEBRERO", desde: 10, hasta: 13 },
  { nombre: "MARZO", desde: 14, hasta: 17 },
  { nombre: "ABRIL", desde: 18, hasta: 22 },
  { nombre: "MAYO", desde: 23, hasta: 26 },
  { nombre: "JUNIO", desde: 27, hasta: 30 },
  { nombre: "JULIO", desde: 31, hasta: 35 },
  { nombre: "AGOSTO", desde: 36, hasta: 39 },
  { nombre: "SEPTIEMBRE", desde: 40, hasta: 43 },
  { nombre: "OCTUBRE", desde: 44, hasta: 48 },
  { nombre: "NOVIEMBRE", desde: 49, hasta: 52 },
];

const HistoricoContext = createContext(null);

export function useHistorico() {
  const ctx = useContext(HistoricoContext);
  if (!ctx) throw new Error("useHistorico debe usarse dentro de <HistoricoProvider />");
  return ctx;
}

const uid = () => `t_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const blankCelda = () => ({
  valor: "", // number o "" vacío
  oro: false,
  doble: false,
  triple: false,
  penal1: false,
  penal10: false,
  nosuma: false,
  simple: false, // para el violeta “normal”
});

const aplicarTipo = (celda, tipo) => {
  const base = { ...blankCelda(), valor: celda?.valor ?? "" };
  if (!tipo || tipo === "limpio") return base;

  if (tipo === "oro") base.oro = true;
  if (tipo === "doble") base.doble = true;
  if (tipo === "triple") base.triple = true;
  if (tipo === "penal1") base.penal1 = true;
  if (tipo === "penal10") base.penal10 = true;
  if (tipo === "nosuma") base.nosuma = true;
  if (tipo === "simple") base.simple = true;

  return base;
};

const calcularTotal = (jug) => {
  if (!jug?.semanas) return 0;
  return jug.semanas.reduce((acc, c) => {
    const v = typeof c?.valor === "number" ? c.valor : Number(c?.valor);
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);
};

const crearTorneoVacio = () => ({
  id: uid(),
  nombre: "Torneo pasado (editar nombre)",
  totalSemanas: 52,
  meses: MESES_HOME,
  campeon: { jugadorId: "", nombre: "", fotoId: "" },
  podio: [
    { pos: 1, jugadorId: "", nombre: "", fotoId: "" },
    { pos: 2, jugadorId: "", nombre: "", fotoId: "" },
    { pos: 3, jugadorId: "", nombre: "", fotoId: "" },
  ],
  jugadores: [], // { id, nombre, fotoId, semanas: [celda...] }
  creadoEn: new Date().toISOString(),
});

export function HistoricoProvider({ children }) {
  const [torneos, setTorneos] = useState([]);

  // cargar
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) setTorneos(data);
    } catch {
      // si estaba corrupto, lo ignoramos
    }
  }, []);

  // guardar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(torneos));
  }, [torneos]);

  // ===== API =====

  const addTorneo = () => {
    setTorneos((prev) => [crearTorneoVacio(), ...prev]);
  };

  const deleteTorneo = (torneoId) => {
    setTorneos((prev) => prev.filter((t) => t.id !== torneoId));
  };

  const updateTorneo = (torneoId, patch) => {
    setTorneos((prev) =>
      prev.map((t) => (t.id === torneoId ? { ...t, ...patch } : t))
    );
  };

  const addJugador = (torneoId, nombre, fotoId = "") => {
    const n = (nombre || "").trim();
    if (!n) return;

    setTorneos((prev) =>
      prev.map((t) => {
        if (t.id !== torneoId) return t;

        const jugador = {
          id: uid(),
          nombre: n,
          fotoId,
          semanas: Array.from({ length: t.totalSemanas }, () => blankCelda()),
        };

        return { ...t, jugadores: [...t.jugadores, jugador] };
      })
    );
  };

  const removeJugador = (torneoId, jugadorId) => {
    setTorneos((prev) =>
      prev.map((t) => {
        if (t.id !== torneoId) return t;
        return { ...t, jugadores: t.jugadores.filter((j) => j.id !== jugadorId) };
      })
    );
  };

  const updateJugador = (torneoId, jugadorId, patch) => {
    setTorneos((prev) =>
      prev.map((t) => {
        if (t.id !== torneoId) return t;
        return {
          ...t,
          jugadores: t.jugadores.map((j) => (j.id === jugadorId ? { ...j, ...patch } : j)),
        };
      })
    );
  };

  const setCelda = (torneoId, jugadorId, semanaIdx, valor, tipo) => {
    setTorneos((prev) =>
      prev.map((t) => {
        if (t.id !== torneoId) return t;

        const jugadores = t.jugadores.map((j) => {
          if (j.id !== jugadorId) return j;

          const semanas = [...j.semanas];
          const celdaActual = semanas[semanaIdx] || blankCelda();
          const valNumber =
            valor === "" ? "" : Number.isFinite(Number(valor)) ? Number(valor) : "";

          const nueva = aplicarTipo({ ...celdaActual, valor: valNumber }, tipo);
          semanas[semanaIdx] = nueva;

          return { ...j, semanas };
        });

        return { ...t, jugadores };
      })
    );
  };

  const value = useMemo(
    () => ({
      torneos,
      addTorneo,
      deleteTorneo,
      updateTorneo,
      addJugador,
      removeJugador,
      updateJugador,
      setCelda,
      calcularTotal,
    }),
    [torneos]
  );

  return <HistoricoContext.Provider value={value}>{children}</HistoricoContext.Provider>;
}
