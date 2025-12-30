import { useMemo } from "react";
import { useHistorico } from "../context/HistoricoContext";

const imgs = import.meta.glob("../assets/jugadores/*.png", {
  eager: true,
  import: "default",
});

function fotoPorId(fotoId) {
  if (!fotoId) return "";
  const key = `../assets/jugadores/${fotoId}.png`;
  return imgs[key] || "";
}

export default function VitrinaCampeones() {
  const { torneos } = useHistorico();

  const items = useMemo(() => {
    return torneos
      .slice()
      .reverse()
      .map((t) => ({
        id: t.id,
        nombre: t.nombre,
        campeon: t.campeon,
        podio: t.podio,
      }));
  }, [torneos]);

  return (
    <div style={{ margin: "16px 0" }}>
      <h2 style={{ color: "white", textAlign: "center", marginBottom: 10 }}>
        Vitrina de Campeones
      </h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: "10px 12px",
        }}
      >
        {items.map((t) => {
          const campeonFoto = fotoPorId(t.campeon?.fotoId);
          const campeonNombre = t.campeon?.nombre || "Sin campeón";

          return (
            <div
              key={t.id}
              style={{
                minWidth: 260,
                background: "rgba(25, 19, 38, 0.9)",
                border: "2px solid #7b2cff",
                borderRadius: 14,
                padding: 12,
                boxShadow: "0 0 20px #5b1aff55",
              }}
            >
              <div style={{ color: "#e7d8ff", fontWeight: 800, marginBottom: 6 }}>
                {t.nombre}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#2b1a46",
                    border: "1px solid #2d2344",
                    flexShrink: 0,
                  }}
                >
                  {campeonFoto ? (
                    <img
                      src={campeonFoto}
                      alt={campeonNombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </div>

                <div style={{ color: "white" }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    🥇 {campeonNombre}
                  </div>

                  <div style={{ marginTop: 6, fontSize: 13, color: "#cbb3ff" }}>
                    Podio:{" "}
                    {t.podio?.map((p) => `${p.pos}° ${p.nombre || "-"}`).join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
