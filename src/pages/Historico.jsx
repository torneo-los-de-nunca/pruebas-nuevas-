import { useMemo, useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { MESES_HOME, useHistorico } from "../context/HistoricoContext";
import VitrinaCampeones from "../components/VitrinaCampeones";

const TOTAL_SEMANAS = 52;
const semanasArray = Array.from({ length: TOTAL_SEMANAS }, (_, i) => i + 1);

const normalizarSemana = (entrada) => {
  if (!entrada) return {};
  if (typeof entrada === "number") return { valor: entrada };
  return entrada;
};

// Render de celda con la MISMA lógica visual que Home
function renderCelda(celda, key) {
  const semana = normalizarSemana(celda);
  const valor = semana.valor ?? "";

  const esOro = !!semana.oro;
  const esDoble = !!semana.doble;
  const esTriple = !!semana.triple;
  const esPenal1 = !!semana.penal1;
  const esPenal10 = !!semana.penal10;
  const esNoSuma = !!semana.nosuma;
  const esSimpleVioleta = !!semana.simple;

  // 0 gris
  if (valor === 0) {
    return (
      <td key={key} style={{ backgroundColor: "#808080", color: "white" }}>
        {valor}
      </td>
    );
  }

  const style = {};

  // penales rojo
  if ((esPenal1 || esPenal10) && typeof valor === "number" && valor < 0) {
    style.backgroundColor = "#e74c3c";
    style.color = "white";
    return (
      <td key={key} style={style}>
        {valor}
      </td>
    );
  }

  const colores = [];
  if (esOro) colores.push("#f1c40f");
  if (esDoble) colores.push("#3498db");
  if (esTriple) colores.push("#9b59b6");

  // uno solo
  if (colores.length === 1 && valor !== "") {
    style.backgroundColor = colores[0];
    return (
      <td key={key} style={style}>
        {valor}
      </td>
    );
  }

  // combinados (gradiente)
  if (colores.length > 1 && valor !== "") {
    const partes = colores.map((c, i) => {
      const start = (100 / colores.length) * i;
      const end = (100 / colores.length) * (i + 1);
      return `${c} ${start}% ${end}%`;
    });
    style.backgroundImage = `linear-gradient(135deg, ${partes.join(", ")})`;
    return (
      <td key={key} style={style}>
        {valor}
      </td>
    );
  }

  // no suma gris
  if (esNoSuma && valor !== "") {
    style.backgroundColor = "#808080";
    style.color = "white";
    return (
      <td key={key} style={style}>
        {valor}
      </td>
    );
  }

  // violeta “simple”
  if (esSimpleVioleta && valor !== "") {
    style.backgroundColor = "#c59bff";
    return (
      <td key={key} style={style}>
        {valor}
      </td>
    );
  }

  return <td key={key}>{valor}</td>;
}

function FotoSelect({ value, onChange }) {
  // ids según assets/jugadores del zip
  const opciones = [
    "",
    "oso",
    "picante",
    "mistico",
    "potencia",
    "sombra",
    "profesor",
    "tia",
    "conejo",
    "german",
    "marcelito",
    "navai",
  ];

  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o === "" ? "sin foto" : o}
        </option>
      ))}
    </select>
  );
}

export default function Historico() {
  const { isAdmin } = useAdmin();
  const {
    torneos,
    addTorneo,
    deleteTorneo,
    updateTorneo,
    addJugador,
    removeJugador,
    updateJugador,
    setCelda,
    calcularTotal,
  } = useHistorico();

  return (
    <div style={{ paddingBottom: 30 }}>
      <div style={{ textAlign: "center", color: "white", marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>LOS DE NUNCA</h1>
        <h2 style={{ marginTop: 6, opacity: 0.85 }}>Histórico</h2>
      </div>

      {/* VITRINA */}
      <VitrinaCampeones />

      {/* ADMIN: crear torneo */}
      {isAdmin ? (
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 18px" }}>
          <button
            onClick={addTorneo}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "2px solid #7b2cff",
              background: "#191326",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 0 20px #5b1aff55",
            }}
          >
            + Agregar torneo pasado
          </button>
        </div>
      ) : null}

      {/* LISTA TORNEOS */}
      {torneos.map((t) => (
        <TorneoPasado
          key={t.id}
          torneo={t}
          isAdmin={isAdmin}
          onDelete={() => deleteTorneo(t.id)}
          onUpdate={(patch) => updateTorneo(t.id, patch)}
          onAddJugador={(nombre, fotoId) => addJugador(t.id, nombre, fotoId)}
          onRemoveJugador={(jugadorId) => removeJugador(t.id, jugadorId)}
          onUpdateJugador={(jugadorId, patch) => updateJugador(t.id, jugadorId, patch)}
          onSetCelda={(jugadorId, semanaIdx, valor, tipo) =>
            setCelda(t.id, jugadorId, semanaIdx, valor, tipo)
          }
          calcularTotal={calcularTotal}
        />
      ))}
    </div>
  );
}

function TorneoPasado({
  torneo,
  isAdmin,
  onDelete,
  onUpdate,
  onAddJugador,
  onRemoveJugador,
  onUpdateJugador,
  onSetCelda,
  calcularTotal,
}) {
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaFoto, setNuevaFoto] = useState("");

  const jugadoresOrdenados = useMemo(() => {
    const lista = torneo.jugadores.map((j) => ({ ...j, total: calcularTotal(j) }));
    lista.sort((a, b) => b.total - a.total);
    return lista;
  }, [torneo.jugadores, calcularTotal]);

  return (
    <div style={{ margin: "26px 0" }}>
      {/* HEADER TORNEO */}
      <div
        style={{
          width: "95%",
          margin: "0 auto 10px",
          background: "rgba(25, 19, 38, 0.9)",
          border: "2px solid #7b2cff",
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 0 20px #5b1aff55",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {isAdmin ? (
            <input
              value={torneo.nombre}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              style={{ flex: 1, minWidth: 220, padding: "8px 10px", borderRadius: 10 }}
            />
          ) : (
            <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>{torneo.nombre}</div>
          )}

          {isAdmin ? (
            <button
              onClick={onDelete}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                background: "#e74c3c",
                color: "white",
                border: "none",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Eliminar
            </button>
          ) : null}
        </div>

        {/* Campeón + podio (editable en admin) */}
        <div style={{ marginTop: 10, color: "#e7d8ff", fontWeight: 800 }}>
          Campeón y podio
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 8 }}>
          {[1, 2, 3].map((pos) => {
            const p = torneo.podio?.find((x) => x.pos === pos) || { pos, nombre: "", fotoId: "" };
            return (
              <div key={pos} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 34, color: "white", fontWeight: 900 }}>
                  {pos}°
                </div>

                {isAdmin ? (
                  <>
                    <input
                      value={p.nombre || ""}
                      onChange={(e) => {
                        const nuevo = (torneo.podio || []).map((x) =>
                          x.pos === pos ? { ...x, nombre: e.target.value } : x
                        );
                        onUpdate({ podio: nuevo });
                        if (pos === 1) onUpdate({ campeon: { ...torneo.campeon, nombre: e.target.value } });
                      }}
                      placeholder="Nombre"
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 10 }}
                    />
                    <FotoSelect
                      value={p.fotoId || ""}
                      onChange={(fotoId) => {
                        const nuevo = (torneo.podio || []).map((x) =>
                          x.pos === pos ? { ...x, fotoId } : x
                        );
                        onUpdate({ podio: nuevo });
                        if (pos === 1) onUpdate({ campeon: { ...torneo.campeon, fotoId } });
                      }}
                    />
                  </>
                ) : (
                  <div style={{ color: "white" }}>{p.nombre || "-"}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Agregar jugador */}
        {isAdmin ? (
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Agregar jugador (nombre)"
              style={{ flex: 1, minWidth: 220, padding: "8px 10px", borderRadius: 10 }}
            />
            <FotoSelect value={nuevaFoto} onChange={setNuevaFoto} />
            <button
              onClick={() => {
                onAddJugador(nuevoNombre, nuevaFoto);
                setNuevoNombre("");
                setNuevaFoto("");
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "2px solid #7b2cff",
                background: "#191326",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              + Agregar
            </button>
          </div>
        ) : null}
      </div>

      {/* TABLA (MISMO DISEÑO QUE HOME) */}
      <div className="tabla-wrapper">
        <table className="tabla-torneo">
          <thead>
            <tr>
              <th>JUGADOR</th>
              <th>PUNTOS</th>
              {MESES_HOME.map((mes) => (
                <th key={mes.nombre} colSpan={mes.hasta - mes.desde + 1}>
                  {mes.nombre}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              <th></th>
              {semanasArray.map((sem) => (
                <th key={sem}>{sem}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {jugadoresOrdenados.map((j, idx) => (
              <tr key={j.id}>
                <td className="celda-jugador" title={j.nombre}>
                  {idx + 1}° {j.nombre}
                </td>
                <td className="celda-total">{j.total}</td>

                {semanasArray.map((sem) => {
                  const semanaIdx = sem - 1;
                  const celda = j.semanas?.[semanaIdx] || {};

                  if (!isAdmin) return renderCelda(celda, `${j.id}-${sem}`);

                  // ADMIN: editor de celda
                  const valor = celda.valor ?? "";
                  const tipoActual = (() => {
                    if (celda.oro) return "oro";
                    if (celda.doble) return "doble";
                    if (celda.triple) return "triple";
                    if (celda.penal1) return "penal1";
                    if (celda.penal10) return "penal10";
                    if (celda.nosuma) return "nosuma";
                    if (celda.simple) return "simple";
                    return "limpio";
                  })();

                  return (
                    <td key={`${j.id}-${sem}`} style={{ padding: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <input
                          value={valor === "" ? "" : String(valor)}
                          onChange={(e) => onSetCelda(j.id, semanaIdx, e.target.value, tipoActual)}
                          style={{
                            width: "100%",
                            height: 20,
                            border: "none",
                            outline: "none",
                            textAlign: "center",
                            fontSize: 12,
                          }}
                        />
                        <select
                          value={tipoActual}
                          onChange={(e) => onSetCelda(j.id, semanaIdx, valor, e.target.value)}
                          style={{
                            width: "100%",
                            height: 18,
                            border: "none",
                            outline: "none",
                            fontSize: 10,
                          }}
                        >
                          <option value="limpio">—</option>
                          <option value="simple">violeta</option>
                          <option value="oro">oro</option>
                          <option value="doble">doble</option>
                          <option value="triple">triple</option>
                          <option value="penal1">penal -1</option>
                          <option value="penal10">penal -10</option>
                          <option value="nosuma">no suma</option>
                        </select>
                      </div>
                    </td>
                  );
                })}

                {isAdmin ? (
                  <td style={{ width: 90 }}>
                    <button
                      onClick={() => onRemoveJugador(j.id)}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 10,
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Borrar
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
