import React, { useState, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { useLiveQuery } from "dexie-react-hooks";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Home,
  LayoutGrid,
  Library,
  Pause,
  Play,
  Plus,
  Settings,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
  X,
  CalendarDays,
  Utensils,
  History,
  Weight,
  Trash2,
  Undo2,
  CheckCircle2,
  ShieldCheck,
  GripVertical,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  db,
  init,
  startSession,
  uid,
  dateKey,
  lb,
  kg,
  exercises,
  exercise,
  initialProfile,
  progression,
  volume,
  backup,
  restore,
  validateBackup,
  csv,
  type Profile,
  type Session,
  type Entry,
  type Routine,
  type Meal,
} from "./model";
import { Field, Modal, Empty, Chart, Heading, Metric, ExerciseArt } from "./ui";
import "./style.css";
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const fmtDate = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("es", {
    day: "numeric",
    month: "short",
  });
const duration = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
function download(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const nav = [
  { id: "home", name: "Mi resumen", icon: Home },
  { id: "routine", name: "Mi rutina", icon: Dumbbell },
  { id: "stats", name: "Estadísticas", icon: TrendingUp },
  { id: "body", name: "Peso corporal", icon: Weight },
  { id: "food", name: "Nutrición", icon: Utensils },
  { id: "calendar", name: "Calendario", icon: CalendarDays },
  { id: "history", name: "Historial", icon: History },
  { id: "library", name: "Ejercicios", icon: Library },
];
function App() {
  const [pwaError, setPwaError] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onRegisterError: () => setPwaError(true),
  });
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      setPwaError(true);
      return;
    }
    let cancelled = false;
    // An already installed worker is ready too, including after an offline reopen.
    void navigator.serviceWorker.ready
      .then(() => {
        if (!cancelled) setOfflineReady(true);
      })
      .catch(() => {
        if (!cancelled) setPwaError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setOfflineReady]);
  const [page, setPage] = useState("home");
  const [online, setOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [tutorial, setTutorial] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [undo, setUndo] = useState<Session | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const data = useLiveQuery(
    async () => ({
      profile: (await db.settings.get("profile"))?.value ?? initialProfile,
      routines: await db.routines.toArray(),
      sessions: await db.sessions.orderBy("started").reverse().toArray(),
      weights: await db.weights.orderBy("date").toArray(),
      meals: await db.meals.toArray(),
      schedule: await db.schedule.toArray(),
    }),
    [],
  );
  useEffect(() => {
    init().catch((e) =>
      setError("No se pudo abrir el almacenamiento local: " + e.message),
    );
    const a = () => setOnline(navigator.onLine);
    window.addEventListener("online", a);
    window.addEventListener("offline", a);
    const t = setInterval(() => setNow(Date.now()), 1000);
    const reject = (e: PromiseRejectionEvent) => {
      setError("No se pudo guardar el cambio. " + String(e.reason));
    };
    window.addEventListener("unhandledrejection", reject);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", a);
      window.removeEventListener("offline", a);
      window.removeEventListener("unhandledrejection", reject);
    };
  }, []);
  useEffect(() => {
    if (data && !data.profile.tutorial) setTutorial(true);
  }, [data?.profile.tutorial]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const active = data?.sessions.find((s) => s.status === "active");
  useEffect(() => {
    if (active?.restEnd && now >= active.restEnd) {
      navigator.vibrate?.([200, 100, 200]);
      setToast("Descanso terminado. ¡Vamos con la siguiente serie!");
      void db.sessions.update(active.id, { restEnd: undefined });
    }
  }, [now, active?.restEnd]);
  if (!data)
    return (
      <div className="loading">
        HYPERTROPHY
        <span>{error || "Preparando tu espacio de entrenamiento…"}</span>
      </div>
    );
  const { profile: p, routines, sessions, weights, meals, schedule } = data;
  const complete = sessions.filter((s) => s.status === "complete");
  const today = dateKey();
  const currentKg = weights.at(-1)?.kg ?? p.startKg;
  const val = (n: number) => (p.unit === "lb" ? lb(n) : n);
  const display = (n: number) => val(n).toFixed(1);
  const startWeek = new Date();
  startWeek.setDate(startWeek.getDate() - ((startWeek.getDay() + 6) % 7));
  const wk = dateKey(startWeek);
  const weekly = complete.filter((s) => s.date >= wk && s.date <= today);
  const weeklyDays = new Set(weekly.map((s) => s.date)).size;
  function occurrence(r: Routine, offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + ((r.day - d.getDay() + 7) % 7) + offset);
    const id = `${r.id}:${dateKey(d)}`;
    return {
      id,
      routineId: r.id,
      date: schedule.find((s) => s.id === id)?.date ?? dateKey(d),
    };
  }
  const upcoming = routines
    .flatMap((r) => [occurrence(r, -7), occurrence(r), occurrence(r, 7)])
    .filter(
      (o) =>
        o.date >= today &&
        !complete.some((s) => s.routineId === o.routineId && s.date === o.date),
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const next =
    routines.find((r) => r.id === upcoming?.routineId) ?? routines[0];
  const saveProfile = async (v: Profile) => {
    await db.settings.put({ id: "profile", value: v });
  };
  async function start(r: Routine) {
    if (active) {
      setPage("active");
      return;
    }
    await startSession(r, today);
    setPage("active");
  }
  async function update(s: Session) {
    await db.sessions.put(s);
  }
  const viewTitle =
    page === "active"
      ? "Tu sesión"
      : (nav.find((n) => n.id === page)?.name ?? "Ajustes");
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setPage("home")}>
          <span className="brand-icon">
            <Activity size={24} />
          </span>
          HYPERTROPHY<span className="brand-dot">.</span>
        </a>
        <p className="nav-label">TU ESPACIO PERSONAL</p>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "nav-item selected" : "nav-item"}
              onClick={() => setPage(n.id)}
            >
              <n.icon size={19} />
              {n.name}
              {n.id === "routine" && <span className="pill">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-info">
            <ShieldCheck size={21} />
            <div>
              Tus datos son tuyos<small>Guardados en este dispositivo</small>
            </div>
          </div>
          <button
            className={"nav-item " + (page === "settings" ? "selected" : "")}
            onClick={() => setPage("settings")}
          >
            <Settings size={19} />
            Ajustes
          </button>
          <div className="profile">
            <span className="avatar">{p.name.slice(0, 2).toUpperCase()}</span>
            <div>
              {p.name}
              <small>Construyendo mi mejor versión</small>
            </div>
            <button
              className="icon"
              aria-label="Editar perfil"
              onClick={() => setPage("settings")}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="shell">
        <header className="topbar">
          <span className="breadcrumb">
            Mi espacio <ChevronRight size={13} /> <b>{viewTitle}</b>
          </span>
          <div className="row">
            <span className={"connection " + (!online ? "offline" : "")}>
              {online ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
              {online ? "Conectado" : "Sin conexión"}
              <i />
            </span>
            <button
              className="icon"
              aria-label="Ajustes"
              onClick={() => setPage("settings")}
            >
              <Settings size={19} />
            </button>
            <span className="avatar small">{p.name.slice(0, 1)}</span>
          </div>
        </header>
        <main>
          <div className="offline-readiness" role="status">
            {pwaError
              ? "No se pudo activar el modo offline. Abre la app por HTTPS y vuelve a intentarlo."
              : offlineReady
                ? "Listo para usar sin conexión"
                : import.meta.env.DEV
                  ? "Modo desarrollo: comprueba offline con la compilación de producción."
                  : "Preparando los recursos para uso sin conexión…"}
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
              <button onClick={() => setError("")}>Cerrar</button>
            </div>
          )}
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CADA REPETICIÓN CUENTA</div>
                  <h1>
                    Vamos a por más, {p.name}
                    <span className="blue">.</span>
                  </h1>
                  <p>
                    Tu mejor versión se construye un entrenamiento a la vez.
                  </p>
                </div>
                <span className="date-label">
                  <CalendarDays size={16} />
                  {new Date().toLocaleDateString("es", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="dashboard-top">
                <section className="hero">
                  <div className="hero-content">
                    <span className="hero-tag">
                      <i />
                      {upcoming?.date === today
                        ? "TU ENTRENAMIENTO DE HOY"
                        : "TU PRÓXIMO ENTRENAMIENTO"}
                    </span>
                    <div className="hero-kicker">FUERZA CON PROPÓSITO</div>
                    <h2>
                      {next?.name ?? "Tu rutina"}
                      <span>Construye tu siguiente nivel.</span>
                    </h2>
                    <p>
                      Un cuerpo más fuerte. Una repetición más.
                      <br />
                      Hoy inviertes en ti.
                    </p>
                    <div className="hero-meta">
                      <span>
                        <Dumbbell size={16} />
                        {next?.items.length ?? 0} ejercicios
                      </span>
                      <span>
                        <Clock size={16} />
                        45–60 min
                      </span>
                      <span>
                        <Flame size={16} />
                        Hipertrofia
                      </span>
                    </div>
                    <button
                      className="primary"
                      onClick={() => next && start(next)}
                    >
                      <Play size={17} fill="currentColor" />
                      {active
                        ? "Continuar entrenamiento"
                        : "Comenzar entrenamiento"}
                      <ArrowRight size={19} />
                    </button>
                    <small>
                      {upcoming &&
                        `${days[new Date(upcoming.date + "T12:00:00").getDay()]} · ${fmtDate(upcoming.date)}`}
                      <span> · Full Body · Nivel inicial</span>
                    </small>
                  </div>
                  <img
                    className="hero-art"
                    src="/strength.svg"
                    alt="Ilustración de una mancuerna de acero con iluminación azul"
                  />
                </section>
                <section className="card week-card">
                  <div className="row spread">
                    <h3>Tu semana</h3>
                    <span className="mini-label">{fmtDate(wk)}</span>
                  </div>
                  <div className="week-progress">
                    <strong>
                      {weeklyDays}
                      <span>/ {routines.length}</span>
                    </strong>
                    <span>
                      entrenamientos
                      <br />
                      completados
                    </span>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.min(100, (weeklyDays / Math.max(1, routines.length)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="week-days">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(startWeek);
                      d.setDate(d.getDate() + i);
                      const key = dateKey(d);
                      const done = weekly.some((s) => s.date === key);
                      const planned = routines.some(
                        (r) => r.day === d.getDay(),
                      );
                      return (
                        <div key={i}>
                          <span>{["L", "M", "X", "J", "V", "S", "D"][i]}</span>
                          <b
                            className={
                              done
                                ? "done"
                                : key === today
                                  ? "today"
                                  : planned
                                    ? "planned"
                                    : ""
                            }
                          >
                            {done ? <Check size={15} /> : d.getDate()}
                          </b>
                        </div>
                      );
                    })}
                  </div>
                  <div className="subtle-note">
                    <span className="green-dot" />
                    La constancia transforma.
                  </div>
                </section>
              </div>
              <div className="metric-grid">
                <Metric
                  icon={<Weight />}
                  label="PESO ACTUAL"
                  value={display(currentKg)}
                  unit={p.unit}
                  detail={
                    weights.length
                      ? "Último peso registrado"
                      : "Peso inicial · añade tu primer registro"
                  }
                  action={() => setPage("body")}
                />
                <Metric
                  icon={<Target />}
                  label="TU OBJETIVO"
                  value={display(p.goalKg)}
                  unit={p.unit}
                  detail={`${display(Math.max(0, p.goalKg - currentKg))} ${p.unit} para tu objetivo`}
                  action={() => setPage("body")}
                />
                <Metric
                  icon={<Dumbbell />}
                  label="ENTRENAMIENTOS"
                  value={String(complete.length)}
                  unit="sesiones"
                  detail="Cada sesión suma a tu progreso"
                  action={() => setPage("history")}
                />
                <Metric
                  icon={<Flame />}
                  label="ENERGÍA DIARIA"
                  value={p.calories.toLocaleString("es")}
                  unit="kcal"
                  detail={`${p.protein} g de proteína · objetivo diario`}
                  action={() => setPage("food")}
                />
              </div>
              <div className="dashboard-lower">
                <section className="card">
                  <div className="section-head">
                    <div>
                      <h3>Tu plan de entrenamiento</h3>
                      <p>Tres días. Todo el cuerpo. Un objetivo.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("routine")}
                    >
                      Ver rutina <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="routine-preview">
                    {[...routines]
                      .sort((a, b) => a.day - b.day)
                      .map((r, i) => (
                        <button
                          key={r.id}
                          onClick={() => start(r)}
                          className={
                            "plan-preview " +
                            (r.id === next?.id ? "highlight" : "")
                          }
                        >
                          <div className="row spread">
                            <span className="mini-label">
                              {days[r.day].toUpperCase()}
                            </span>
                            <span className="letter">{r.id.toUpperCase()}</span>
                          </div>
                          <h3>{r.name}</h3>
                          <p>
                            {i === 0
                              ? "Pecho, espalda y brazos"
                              : i === 1
                                ? "Espalda, hombros y piernas"
                                : "Pecho, brazos y piernas"}
                          </p>
                          <div className="row spread">
                            <small>
                              {r.items.reduce((n, x) => n + x.sets, 0)} series ·{" "}
                              {r.items.length} ejercicios
                            </small>
                            <ArrowRight size={16} />
                          </div>
                        </button>
                      ))}
                  </div>
                </section>
                <section className="card focus-card">
                  <div className="row spread">
                    <h3>En el camino correcto</h3>
                    <span className="icon-tile">
                      <TrendingUp size={19} />
                    </span>
                  </div>
                  <div className="goal-line">
                    <strong>
                      {display(currentKg)} <small>{p.unit}</small>
                    </strong>
                    <span>→</span>
                    <strong>
                      {display(p.goalKg)} <small>{p.unit}</small>
                    </strong>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: `${Math.max(0, Math.min(100, ((currentKg - p.startKg) / (p.goalKg - p.startKg || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <p>Pequeños pasos. Grandes cambios.</p>
                  <div className="tip">
                    <span>↗</span>
                    <div>
                      Apunta a subir 0.3–0.6 lb por semana.
                      <small>Observa la tendencia, no un solo día.</small>
                    </div>
                  </div>
                </section>
              </div>
              <section className="last-session">
                <History size={18} />
                <span>Último entrenamiento</span>
                <b>
                  {complete[0]
                    ? `${complete[0].name} · ${fmtDate(complete[0].date)}`
                    : "Tu historia empieza con la primera sesión"}
                </b>
                <button
                  className="text-button"
                  onClick={() => setPage("history")}
                >
                  Ver historial <ArrowRight size={15} />
                </button>
              </section>
              <footer>
                <span className="blue">●</span> Sin cuentas. Sin distracciones.
                Solo tú y tu progreso.<span>HECHO PARA EL LARGO PLAZO</span>
              </footer>
            </>
          )}
          {page === "active" &&
            (active ? (
              <Active
                session={active}
                previous={complete}
                increments={p.increments}
                now={now}
                unit={p.unit}
                save={update}
                undo={(s) => setUndo(s)}
                finish={async (s) => {
                  await update(s);
                  setPage("history");
                  setToast("Entrenamiento guardado. Cada sesión cuenta.");
                }}
              />
            ) : (
              <Empty text="No hay sesión activa. Comienza desde tu rutina." />
            ))}
          {page === "routine" && (
            <>
              <Heading
                title="Tu plan. Tu progreso."
                sub="Full Body · Tres sesiones equilibradas, con énfasis en el tren superior."
              />
              {active && (
                <button className="primary" onClick={() => setPage("active")}>
                  Continuar sesión activa <ArrowRight size={18} />
                </button>
              )}
              <RoutineEditor routines={routines} start={start} />
            </>
          )}
          {page === "history" && (
            <>
              <Heading
                title="Tu trabajo, registrado."
                sub="Solo las sesiones que has completado. Toca una para consultar o editar."
              />
              {complete.length ? (
                complete.map((s) => (
                  <button
                    className="card history-row"
                    key={s.id}
                    onClick={() => setSelected(s)}
                  >
                    <span className="icon-tile">
                      <CheckCircle2 />
                    </span>
                    <div>
                      <h3>{s.name}</h3>
                      <p>
                        {fmtDate(s.date)} · {duration(s.elapsed / 1000)} min ·{" "}
                        {s.entries.reduce(
                          (n, e) => n + e.sets.filter((x) => x.done).length,
                          0,
                        )}{" "}
                        series
                      </p>
                    </div>
                    <span className="history-vol">
                      {Math.round(volume(s.entries)).toLocaleString("es")} kg
                      <small>volumen de carga</small>
                    </span>
                    <ChevronRight />
                  </button>
                ))
              ) : (
                <Empty text="Todavía no has completado entrenamientos." />
              )}
            </>
          )}
          {page === "body" && (
            <Body weights={weights} p={p} currentKg={currentKg} />
          )}
          {page === "food" && <Nutrition meals={meals} p={p} today={today} />}
          {page === "stats" && (
            <Stats sessions={complete} weights={weights} p={p} />
          )}
          {page === "calendar" && (
            <Calendar
              routines={routines}
              sessions={complete}
              schedule={schedule}
              start={start}
            />
          )}
          {page === "library" && <LibraryView />}
          {page === "settings" && (
            <div className="mobile-extras">
              {nav
                .filter((n) =>
                  ["body", "calendar", "history", "library"].includes(n.id),
                )
                .map((n) => (
                  <button
                    className="secondary"
                    key={n.id}
                    onClick={() => setPage(n.id)}
                  >
                    <n.icon size={18} />
                    {n.name}
                  </button>
                ))}
            </div>
          )}
          {page === "settings" && (
            <SettingsView
              p={p}
              save={saveProfile}
              notify={setToast}
              tutorial={() => setTutorial(true)}
            />
          )}
        </main>
      </div>
      <nav className="bottom-nav">
        {[
          { id: "home", name: "Inicio", icon: Home },
          { id: "routine", name: "Entrenar", icon: Dumbbell },
          { id: "stats", name: "Progreso", icon: TrendingUp },
          { id: "food", name: "Nutrición", icon: Utensils },
          { id: "settings", name: "Más", icon: LayoutGrid },
        ].map((n) => (
          <button
            key={n.id}
            className={page === n.id ? "active" : ""}
            onClick={() => setPage(n.id)}
          >
            <n.icon size={21} />
            <span>{n.name}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
      {undo && (
        <div className="undo">
          <span>Acción guardada</span>
          <button
            onClick={async () => {
              await update(undo);
              setUndo(null);
              setToast("Acción deshecha");
            }}
          >
            <Undo2 size={16} /> Deshacer
          </button>
          <button aria-label="Cerrar deshacer" onClick={() => setUndo(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      {tutorial && (
        <Modal
          title="Bienvenido a HYPERTROPHY"
          close={() => {
            setTutorial(false);
            void saveProfile({ ...p, tutorial: true });
          }}
        >
          <div className="tutorial-symbol">
            <Dumbbell size={42} />
          </div>
          <h2>Tu mejor versión empieza aquí.</h2>
          <p>
            Entrena lunes, miércoles y viernes. Registra peso, repeticiones y
            RIR en cada serie. RIR significa las repeticiones que aún podrías
            hacer con buena técnica.
          </p>
          <p>
            Empieza con cargas cómodas y deja 1–3 repeticiones en reserva. Las
            sugerencias de carga siempre requieren tu confirmación.
          </p>
          <div className="notice">
            <ShieldCheck />
            Tus datos se guardan únicamente en este dispositivo. Exporta copias:
            borrar los datos del navegador o desinstalar puede eliminarlos.
          </div>
          <p>
            En iPhone: abre por HTTPS en Safari → Compartir → Añadir a pantalla
            de inicio. Espera la descarga inicial antes de entrenar sin
            conexión.
          </p>
          <button
            className="primary full"
            onClick={() => {
              setTutorial(false);
              void saveProfile({ ...p, tutorial: true });
            }}
          >
            Vamos a entrenar <ArrowRight size={18} />
          </button>
        </Modal>
      )}
      {selected && (
        <Modal
          title={`${selected.name} · ${fmtDate(selected.date)}`}
          close={() => setSelected(null)}
        >
          <label className="field">
            <span>Fecha</span>
            <input
              type="date"
              value={selected.date}
              onChange={(e) =>
                setSelected({ ...selected, date: e.target.value })
              }
            />
          </label>
          {selected.entries.map((e, ei) => (
            <section key={ei} className="history-edit">
              <h3>{exercise(e.exerciseId).name}</h3>
              {e.sets.map((s, si) => (
                <div className="set-edit" key={si}>
                  <span>{si + 1}</span>
                  <Field
                    label="kg"
                    value={s.kg}
                    step={0.5}
                    onChange={(v) =>
                      setSelected({
                        ...selected,
                        entries: selected.entries.map((x, i) =>
                          i === ei
                            ? {
                                ...x,
                                sets: x.sets.map((y, j) =>
                                  j === si ? { ...y, kg: v } : y,
                                ),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  <Field
                    label="Reps"
                    value={s.reps}
                    max={100}
                    onChange={(v) =>
                      setSelected({
                        ...selected,
                        entries: selected.entries.map((x, i) =>
                          i === ei
                            ? {
                                ...x,
                                sets: x.sets.map((y, j) =>
                                  j === si ? { ...y, reps: Math.round(v) } : y,
                                ),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  <Field
                    label="RIR"
                    value={s.rir}
                    max={10}
                    onChange={(v) =>
                      setSelected({
                        ...selected,
                        entries: selected.entries.map((x, i) =>
                          i === ei
                            ? {
                                ...x,
                                sets: x.sets.map((y, j) =>
                                  j === si ? { ...y, rir: v } : y,
                                ),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </section>
          ))}
          <label className="field">
            Notas
            <textarea
              value={selected.notes}
              onChange={(e) =>
                setSelected({ ...selected, notes: e.target.value })
              }
            />
          </label>
          <button
            className="primary full"
            onClick={async () => {
              if (!selected.date) return;
              setUndo(sessions.find((s) => s.id === selected.id)!);
              await update(selected);
              setSelected(null);
              setToast("Historial actualizado");
            }}
          >
            Guardar cambios
          </button>
        </Modal>
      )}
    </div>
  );
}

function Active({
  session: s,
  previous,
  increments,
  now,
  unit,
  save,
  undo,
  finish,
}: {
  session: Session;
  previous: Session[];
  increments: Record<string, number>;
  now: number;
  unit: "kg" | "lb";
  save: (s: Session) => Promise<void>;
  undo: (s: Session) => void;
  finish: (s: Session) => Promise<void>;
}) {
  const [rest, setRest] = useState(150);
  const [confirm, setConfirm] = useState(false);
  const [alternatives, setAlternatives] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const count = s.entries.reduce((n, e) => n + e.sets.length, 0),
    done = s.entries.reduce(
      (n, e) => n + e.sets.filter((x) => x.done).length,
      0,
    );
  const elapsed = s.elapsed + (s.runningSince ? now - s.runningSince : 0);
  const changed = (i: number, e: Entry) =>
    save({ ...s, entries: s.entries.map((x, j) => (j === i ? e : x)) });
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ENTRENAMIENTO EN CURSO</div>
          <h1>
            {s.name}
            <span className="blue">.</span>
          </h1>
          <p>
            {done} de {count} series completadas · Guardado automático local
          </p>
        </div>
        <div className="session-clock">
          <Clock />
          {duration(elapsed / 1000)}
          <button
            className="icon"
            aria-label={s.runningSince ? "Pausar" : "Reanudar"}
            onClick={() =>
              save({ ...s, elapsed, runningSince: s.runningSince ? null : now })
            }
          >
            {s.runningSince ? <Pause /> : <Play />}
          </button>
        </div>
      </div>
      <div className="progress session-progress">
        <i style={{ width: `${(done / Math.max(1, count)) * 100}%` }} />
      </div>
      {!s.runningSince && (
        <div className="notice">
          Sesión pausada. Reanuda para registrar series.
        </div>
      )}
      <div className="rest card">
        <div>
          <span className="mini-label">DESCANSO</span>
          <strong>
            {s.restEnd
              ? duration(Math.max(0, (s.restEnd - now) / 1000))
              : duration(rest)}
          </strong>
        </div>
        <select
          aria-label="Duración del descanso"
          value={rest}
          onChange={(e) => setRest(+e.target.value)}
        >
          {[60, 90, 120, 150, 180].map((n) => (
            <option key={n} value={n}>
              {n / 60} min
            </option>
          ))}
        </select>
        <button
          className="secondary"
          onClick={() =>
            save({
              ...s,
              restEnd: s.restEnd ? undefined : Date.now() + rest * 1000,
            })
          }
        >
          {s.restEnd ? "Omitir" : "Iniciar descanso"}
        </button>
      </div>
      {s.entries.map((e, i) => {
        const ex = exercise(e.exerciseId);
        const prior = previous
          .flatMap((x) => x.entries)
          .find((x) => x.exerciseId === e.exerciseId);
        const suggestion = progression(
          e,
          prior,
          increments[ex.id] ?? ex.increment,
        );
        return (
          <section className="card active-exercise" key={i}>
            <div className="exercise-head">
              <div className="exercise-image">
                <ExerciseArt id={ex.id} />
              </div>
              <div className="grow">
                <span className="mini-label">
                  {i + 1} / {s.entries.length} · {ex.muscle}
                </span>
                <h2>{ex.name}</h2>
                <p>
                  {e.sets.length} series × {e.min}–{e.max} rep · Descanso{" "}
                  {ex.compound ? "2–3" : "1–2"} min
                </p>
              </div>
              <button
                className="icon"
                aria-label="Subir ejercicio"
                disabled={i === 0}
                onClick={() => {
                  undo(s);
                  const entries = [...s.entries];
                  [entries[i - 1], entries[i]] = [entries[i], entries[i - 1]];
                  void save({ ...s, entries });
                }}
              >
                ↑
              </button>
            </div>
            <p className="technique">{ex.steps.join(" ")}</p>
            <div className="row spread wrap">
              <small>
                Anterior:{" "}
                {prior
                  ? prior.sets
                      .filter((x) => x.done)
                      .map(
                        (x) =>
                          `${(unit === "lb" ? lb(x.kg) : x.kg).toFixed(1)} ${unit} × ${x.reps}`,
                      )
                      .join(" · ")
                  : "Primer registro para este ejercicio"}
              </small>
              <button
                className="text-button"
                onClick={() => setAlternatives(i)}
              >
                Ver alternativas <ArrowRight size={14} />
              </button>
            </div>
            <div className="set-table">
              <div className="set-labels">
                <span>SERIE</span>
                <span>PESO ({unit})</span>
                <span>REPS</span>
                <span>RIR</span>
                <span>HECHO</span>
              </div>
              {e.sets.map((set, j) => (
                <div
                  key={j}
                  className={"set-row " + (set.done ? "completed" : "")}
                >
                  <span className="set-num">{j + 1}</span>
                  <input
                    aria-label={`Peso serie ${j + 1} de ${ex.name}`}
                    type="number"
                    min="0"
                    max="3000"
                    step="0.5"
                    inputMode="decimal"
                    value={+(unit === "lb" ? lb(set.kg) : set.kg).toFixed(1)}
                    disabled={set.done}
                    onChange={(ev) => {
                      const v = +ev.target.value;
                      if (Number.isFinite(v) && v >= 0 && v <= 3000)
                        void changed(i, {
                          ...e,
                          sets: e.sets.map((x, k) =>
                            k === j
                              ? { ...x, kg: unit === "lb" ? kg(v) : v }
                              : x,
                          ),
                        });
                    }}
                  />
                  <input
                    aria-label={`Repeticiones serie ${j + 1}`}
                    type="number"
                    min="0"
                    max="100"
                    inputMode="numeric"
                    value={set.reps}
                    disabled={set.done}
                    onChange={(ev) =>
                      changed(i, {
                        ...e,
                        sets: e.sets.map((x, k) =>
                          k === j
                            ? {
                                ...x,
                                reps: Math.max(
                                  0,
                                  Math.min(100, Math.floor(+ev.target.value)),
                                ),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`RIR serie ${j + 1}`}
                    type="number"
                    min="0"
                    max="10"
                    inputMode="numeric"
                    value={set.rir}
                    disabled={set.done}
                    onChange={(ev) =>
                      changed(i, {
                        ...e,
                        sets: e.sets.map((x, k) =>
                          k === j
                            ? {
                                ...x,
                                rir: Math.max(
                                  0,
                                  Math.min(10, +ev.target.value),
                                ),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  <button
                    aria-label={
                      set.done ? "Desmarcar serie" : "Completar serie"
                    }
                    className={"set-check " + (set.done ? "checked" : "")}
                    disabled={!s.runningSince || (!set.done && set.reps < 1)}
                    onClick={() => {
                      undo(s);
                      const entries = s.entries.map((x, k) =>
                        k === i
                          ? {
                              ...x,
                              sets: x.sets.map((y, n) =>
                                n === j ? { ...y, done: !y.done } : y,
                              ),
                            }
                          : x,
                      );
                      void save({
                        ...s,
                        entries,
                        restEnd: !set.done
                          ? Date.now() +
                            (ex.compound ? rest : Math.min(rest, 120)) * 1000
                          : s.restEnd,
                      });
                    }}
                  >
                    <Check size={20} />
                  </button>
                  <label className="technique-check">
                    <input
                      type="checkbox"
                      checked={set.technique}
                      onChange={(ev) =>
                        changed(i, {
                          ...e,
                          sets: e.sets.map((x, k) =>
                            k === j
                              ? { ...x, technique: ev.target.checked }
                              : x,
                          ),
                        })
                      }
                    />{" "}
                    Técnica controlada
                  </label>
                </div>
              ))}
            </div>
            <div className="row spread wrap">
              <button
                className="text-button"
                disabled={e.sets.length >= 20}
                onClick={() => {
                  undo(s);
                  void changed(i, {
                    ...e,
                    sets: [
                      ...e.sets,
                      {
                        kg: e.sets.at(-1)?.kg ?? 0,
                        reps: 0,
                        rir: 2,
                        technique: true,
                        done: false,
                      },
                    ],
                  });
                }}
              >
                <Plus size={16} />
                Añadir serie
              </button>
              <button
                className="text-button muted"
                disabled={e.sets.length <= 1}
                onClick={() => {
                  undo(s);
                  void changed(i, { ...e, sets: e.sets.slice(0, -1) });
                }}
              >
                <Trash2 size={14} />
                Quitar última
              </button>
            </div>
            <label className="field">
              <span>Notas del ejercicio</span>
              <input
                placeholder="Sensaciones, ajustes, técnica…"
                value={e.notes}
                onChange={(ev) => changed(i, { ...e, notes: ev.target.value })}
              />
            </label>
            {e.sets.every((x) => x.done) && (
              <div className="suggestion">
                <TrendingUp size={18} />
                <span>
                  {suggestion.message}
                  {suggestion.suggested !== null &&
                    ` · Próxima sesión: ${(unit === "lb" ? lb(suggestion.suggested) : suggestion.suggested).toFixed(1)} ${unit} (incremento ${increments[ex.id] ?? ex.increment} kg). Confirma editando la carga al empezar.`}
                </span>
              </div>
            )}
          </section>
        );
      })}
      <label className="field">
        <span>Notas de la sesión</span>
        <textarea
          value={s.notes}
          onChange={(e) => save({ ...s, notes: e.target.value })}
        />
      </label>
      <button
        className="primary full"
        disabled={!done}
        onClick={() => setConfirm(true)}
      >
        <CheckCircle2 size={20} />
        Finalizar entrenamiento
      </button>
      {confirm && (
        <Modal title="Guardar entrenamiento" close={() => setConfirm(false)}>
          <p>
            Has completado {done} de {count} series. Solo las series marcadas
            contarán en tus estadísticas. Las pendientes seguirán visibles en el
            historial.
          </p>
          <button
            className="primary full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await finish({
                ...s,
                status: "complete",
                ended: now,
                elapsed,
                runningSince: null,
                restEnd: undefined,
              });
              setConfirm(false);
            }}
          >
            Confirmar y guardar
          </button>
        </Modal>
      )}
      {alternatives !== null && (
        <Modal
          title="Elige una alternativa"
          close={() => setAlternatives(null)}
        >
          <p>
            El cambio requiere tu elección. Las series ya registradas se
            conservan en su ejercicio original.
          </p>
          {exercise(s.entries[alternatives].exerciseId).alternatives.map(
            (id) => (
              <button
                className="alternative"
                key={id}
                onClick={() => {
                  const old = s.entries[alternatives];
                  undo(s);
                  const replacement: Entry = {
                    ...old,
                    exerciseId: id,
                    notes: "",
                    sets: old.sets
                      .filter((x) => !x.done)
                      .map((x) => ({ ...x, kg: 0, reps: 0 })),
                  };
                  if (!replacement.sets.length)
                    replacement.sets = [
                      { kg: 0, reps: 0, rir: 2, done: false, technique: true },
                    ];
                  const entries = [...s.entries];
                  if (old.sets.some((x) => x.done)) {
                    entries[alternatives] = {
                      ...old,
                      sets: old.sets.filter((x) => x.done),
                    };
                    entries.splice(alternatives + 1, 0, replacement);
                  } else entries[alternatives] = replacement;
                  void save({ ...s, entries });
                  setAlternatives(null);
                }}
              >
                <Dumbbell size={19} />
                {exercise(id).name}
                <ArrowRight size={18} />
              </button>
            ),
          )}
        </Modal>
      )}
    </>
  );
}

function RoutineEditor({
  routines,
  start,
}: {
  routines: Routine[];
  start: (r: Routine) => void;
}) {
  const [edit, setEdit] = useState<Routine | null>(null);
  return (
    <>
      <div className="routine-grid">
        {routines.map((r) => (
          <section className="card" key={r.id}>
            <div className="row spread">
              <span className="eyebrow">{days[r.day]}</span>
              <span className="letter">{r.id.toUpperCase()}</span>
            </div>
            <h2>{r.name}</h2>
            {r.items.map((i, j) => (
              <div className="routine-line" key={j}>
                <span>{String(j + 1).padStart(2, "0")}</span>
                <div>
                  {exercise(i.exerciseId).name}
                  <small>
                    {i.sets} × {i.min}–{i.max} · {exercise(i.exerciseId).muscle}
                  </small>
                </div>
              </div>
            ))}
            <button className="primary full" onClick={() => start(r)}>
              <Play size={16} />
              Comenzar sesión
            </button>
            <button
              className="text-button full"
              onClick={() => setEdit(structuredClone(r))}
            >
              Personalizar rutina
            </button>
          </section>
        ))}
      </div>
      {edit && (
        <Modal title="Personalizar rutina" close={() => setEdit(null)}>
          <label className="field">
            <span>Nombre</span>
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Día de entrenamiento</span>
            <select
              value={edit.day}
              onChange={(e) => setEdit({ ...edit, day: +e.target.value })}
            >
              {days.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          {edit.items.map((item, i) => (
            <div className="edit-item" key={i}>
              <div className="row">
                <GripVertical size={15} />
                <select
                  value={item.exerciseId}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      items: edit.items.map((x, j) =>
                        j === i ? { ...x, exerciseId: e.target.value } : x,
                      ),
                    })
                  }
                >
                  {exercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row">
                <Field
                  label="Series"
                  min={1}
                  max={20}
                  value={item.sets}
                  onChange={(v) =>
                    setEdit({
                      ...edit,
                      items: edit.items.map((x, j) =>
                        j === i ? { ...x, sets: Math.round(v) } : x,
                      ),
                    })
                  }
                />
                <Field
                  label="Reps mín."
                  min={1}
                  max={100}
                  value={item.min}
                  onChange={(v) =>
                    setEdit({
                      ...edit,
                      items: edit.items.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              min: Math.round(v),
                              max: Math.max(x.max, Math.round(v)),
                            }
                          : x,
                      ),
                    })
                  }
                />
                <Field
                  label="Reps máx."
                  min={item.min}
                  max={100}
                  value={item.max}
                  onChange={(v) =>
                    setEdit({
                      ...edit,
                      items: edit.items.map((x, j) =>
                        j === i ? { ...x, max: Math.round(v) } : x,
                      ),
                    })
                  }
                />
                <button
                  className="icon"
                  aria-label="Subir"
                  disabled={!i}
                  onClick={() => {
                    const items = [...edit.items];
                    [items[i - 1], items[i]] = [items[i], items[i - 1]];
                    setEdit({ ...edit, items });
                  }}
                >
                  ↑
                </button>
                <button
                  className="icon"
                  aria-label="Eliminar ejercicio"
                  onClick={() =>
                    setEdit({
                      ...edit,
                      items: edit.items.filter((_, j) => i !== j),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            className="secondary full"
            onClick={() =>
              setEdit({
                ...edit,
                items: [
                  ...edit.items,
                  { exerciseId: "e0", sets: 2, min: 8, max: 12 },
                ],
              })
            }
          >
            <Plus size={16} />
            Añadir ejercicio
          </button>
          <button
            className="primary full"
            disabled={!edit.items.length || !edit.name.trim()}
            onClick={async () => {
              await db.routines.put(edit);
              setEdit(null);
            }}
          >
            Guardar rutina
          </button>
        </Modal>
      )}
    </>
  );
}
function Body({
  weights,
  p,
  currentKg,
}: {
  weights: { id: string; date: string; kg: number }[];
  p: Profile;
  currentKg: number;
}) {
  const [unit, setUnit] = useState(p.unit);
  const [weight, setWeight] = useState(
    +(unit === "lb" ? lb(currentKg) : currentKg).toFixed(1),
  );
  const [date, setDate] = useState(dateKey());
  const recent = weights.filter(
    (w) => w.date >= dateKey(new Date(Date.now() - 6 * 86400000)),
  );
  const average = recent.length
    ? recent.reduce((n, w) => n + w.kg, 0) / recent.length
    : null;
  const v = (n: number) => (p.unit === "lb" ? lb(n) : n).toFixed(1);
  return (
    <>
      <Heading
        title="Un poco más fuerte. Un poco más grande."
        sub="Objetivo de aumento: 0.3–0.6 lb por semana. La tendencia importa más que un día."
      />
      <div className="two-columns">
        <section className="card">
          <h3>Registra tu peso</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const k = unit === "lb" ? kg(weight) : weight;
              if (!date || k < 20 || k > 500) return;
              const existing = weights.find((w) => w.date === date);
              await db.weights.put({ id: existing?.id ?? uid(), date, kg: k });
            }}
          >
            <div className="row">
              <Field
                label="Peso corporal"
                min={20}
                max={1100}
                step={0.1}
                value={weight}
                onChange={setWeight}
              />
              <label className="field">
                <span>Unidad</span>
                <select
                  value={unit}
                  onChange={(e) => {
                    const u = e.target.value as "kg" | "lb";
                    setWeight(
                      +(u === "lb" ? lb(weight) : kg(weight)).toFixed(1),
                    );
                    setUnit(u);
                  }}
                >
                  <option>lb</option>
                  <option>kg</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Fecha</span>
              <input
                required
                type="date"
                max={dateKey()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button className="primary full" type="submit">
              <Plus size={18} />
              Guardar peso
            </button>
          </form>
          <div className="weight-summary">
            <span>
              Promedio últimos 7 días
              <b>{average ? v(average) + " " + p.unit : "Sin registros"}</b>
            </span>
            <span>
              Desde el inicio
              <b>
                {v(currentKg - p.startKg)} {p.unit}
              </b>
            </span>
            <span>
              Objetivo
              <b>
                {v(p.goalKg)} {p.unit}
              </b>
            </span>
          </div>
        </section>
        <section className="card">
          <h3>Evolución del peso · {p.unit}</h3>
          <Chart
            data={weights.map((w) => ({
              date: fmtDate(w.date),
              value: +v(w.kg),
            }))}
          />
          <p className="muted">
            El peso fluctúa por agua, comida y otros factores. Estas variaciones
            no equivalen a ganancia de músculo.
          </p>
        </section>
      </div>
      <section className="card">
        <h3>Historial de peso</h3>
        {weights.length ? (
          [...weights].reverse().map((w) => (
            <div className="list-row" key={w.id}>
              <span>{fmtDate(w.date)}</span>
              <strong>
                {v(w.kg)} {p.unit}
              </strong>
              <button
                className="icon"
                aria-label="Eliminar peso"
                onClick={() => {
                  if (confirm("¿Eliminar este registro de peso?"))
                    void db.weights.delete(w.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <Empty text="Registra tu primer peso corporal." />
        )}
      </section>
    </>
  );
}
function Nutrition({
  meals,
  p,
  today,
}: {
  meals: Meal[];
  p: Profile;
  today: string;
}) {
  const [draft, setDraft] = useState({
    name: "",
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    favorite: false,
  });
  const daily = meals.filter((m) => m.date === today);
  const totals = daily.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      carbs: a.carbs + m.carbs,
      fat: a.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return (
    <>
      <Heading
        title="Alimenta tu progreso."
        sub="Un registro sencillo de tu día. Calorías y macronutrientes son estimaciones."
      />
      <div className="metric-grid">
        {[
          ["Calorías", totals.kcal, p.calories, "kcal"],
          ["Proteínas", totals.protein, p.protein, "g"],
          ["Carbohidratos", totals.carbs, null, "g"],
          ["Grasas", totals.fat, null, "g"],
        ].map(([name, n, goal, u]) => (
          <section className="card" key={String(name)}>
            <span className="mini-label">{name}</span>
            <div className="metric-value">
              {n}
              <span>{goal ? `/ ${goal} ${u}` : u}</span>
            </div>
            {goal && (
              <div className="progress">
                <i
                  style={{
                    width: `${Math.min(100, (Number(n) / Number(goal)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </section>
        ))}
      </div>
      <div className="two-columns">
        <section className="card">
          <h3>Añadir comida</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!draft.name.trim()) return;
              await db.meals.put({ ...draft, id: uid(), date: today });
              setDraft({
                name: "",
                kcal: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                favorite: false,
              });
            }}
          >
            <label className="field">
              Nombre
              <input
                required
                value={draft.name}
                placeholder="Por ejemplo, mi batido de avena"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <div className="form-grid">
              {(["kcal", "protein", "carbs", "fat"] as const).map((k, i) => (
                <Field
                  key={k}
                  label={
                    [
                      "Calorías (kcal)",
                      "Proteínas (g)",
                      "Carbohidratos (g)",
                      "Grasas (g)",
                    ][i]
                  }
                  value={draft[k]}
                  onChange={(v) => setDraft({ ...draft, [k]: v })}
                />
              ))}
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={draft.favorite}
                onChange={(e) =>
                  setDraft({ ...draft, favorite: e.target.checked })
                }
              />
              Guardar como comida frecuente
            </label>
            <button className="primary full" type="submit">
              <Plus size={17} />
              Registrar comida
            </button>
          </form>
          {Array.from(
            new Map(
              meals.filter((m) => m.favorite).map((m) => [m.name, m]),
            ).values(),
          ).map((m) => (
            <button
              className="alternative"
              key={m.id}
              onClick={() =>
                void db.meals.put({ ...m, id: uid(), date: today })
              }
            >
              <Plus size={16} />
              {m.name}
              <small>{m.kcal} kcal</small>
            </button>
          ))}
        </section>
        <section className="card">
          <h3>Hoy en tu plato</h3>
          {daily.length ? (
            daily.map((m) => (
              <div className="list-row" key={m.id}>
                <Utensils size={18} />
                <div className="grow">
                  <b>{m.name}</b>
                  <small>
                    {m.protein} g proteína · {m.carbs} g carb. · {m.fat} g grasa
                  </small>
                </div>
                <b>{m.kcal} kcal</b>
                <button
                  className="icon"
                  aria-label="Eliminar comida"
                  onClick={() => {
                    if (confirm("¿Eliminar esta comida?"))
                      void db.meals.delete(m.id);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <Empty text="Añade tu primera comida del día." />
          )}
        </section>
      </div>
    </>
  );
}
function Stats({
  sessions,
  weights,
  p,
}: {
  sessions: Session[];
  weights: { date: string; kg: number }[];
  p: Profile;
}) {
  const [period, setPeriod] = useState("all");
  const [id, setId] = useState("e0");
  const cutoff =
    period === "all"
      ? "0000"
      : dateKey(new Date(Date.now() - (period === "week" ? 7 : 30) * 86400000));
  const ss = sessions
    .filter((s) => s.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
  const records = ss.flatMap((s) =>
    s.entries
      .filter((e) => e.exerciseId === id && e.sets.some((x) => x.done))
      .map((e) => ({
        date: fmtDate(s.date),
        peso: +Math.max(
          ...e.sets
            .filter((x) => x.done)
            .map((x) => (p.unit === "lb" ? lb(x.kg) : x.kg)),
        ).toFixed(1),
        reps: Math.max(...e.sets.filter((x) => x.done).map((x) => x.reps)),
      })),
  );
  const personalSets = sessions.flatMap((s) =>
    s.entries
      .filter((e) => e.exerciseId === id)
      .flatMap((e) => e.sets.filter((x) => x.done)),
  );
  const personalKg = Math.max(0, ...personalSets.map((x) => x.kg));
  const personalReps = Math.max(0, ...personalSets.map((x) => x.reps));
  const muscles = new Map<string, number>();
  ss.forEach((s) =>
    s.entries.forEach((e) => {
      const name = exercise(e.exerciseId).muscle;
      muscles.set(
        name,
        (muscles.get(name) ?? 0) +
          e.sets.filter(
            (x) => x.done && x.technique && x.rir <= 3 && x.reps >= e.min,
          ).length,
      );
    }),
  );
  const weeks = new Map<string, number>();
  ss.forEach((s) => {
    const d = new Date(s.date + "T12:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const k = dateKey(d);
    weeks.set(k, (weeks.get(k) ?? 0) + 1);
  });
  return (
    <>
      <Heading
        title="El progreso se puede ver."
        sub="Tus registros reales, convertidos en perspectiva."
      />
      <div className="row spread wrap filters">
        <div className="segmented">
          {[
            ["week", "Semana"],
            ["month", "Mes"],
            ["all", "Todo"],
          ].map(([v, t]) => (
            <button
              className={period === v ? "active" : ""}
              key={v}
              onClick={() => setPeriod(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          aria-label="Ejercicio para analizar"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="card row spread wrap">
        <div>
          <span className="mini-label">
            RÉCORDS PERSONALES · HISTORIAL COMPLETO
          </span>
          <h3 style={{ marginTop: 8 }}>{exercise(id).name}</h3>
        </div>
        <div>
          <strong>
            {personalSets.length
              ? (p.unit === "lb" ? lb(personalKg) : personalKg).toFixed(1) +
                " " +
                p.unit
              : "—"}
          </strong>
          <small style={{ display: "block" }}>Carga máxima registrada</small>
        </div>
        <div>
          <strong>{personalSets.length ? personalReps + " rep" : "—"}</strong>
          <small style={{ display: "block" }}>Máximo de repeticiones</small>
        </div>
      </div>
      <div className="two-columns">
        <section className="card">
          <h3>Peso corporal · {p.unit}</h3>
          <Chart
            data={weights
              .filter((w) => w.date >= cutoff)
              .map((w) => ({
                date: fmtDate(w.date),
                value: +(p.unit === "lb" ? lb(w.kg) : w.kg).toFixed(1),
              }))}
          />
        </section>
        <section className="card">
          <h3>Carga máxima por sesión · {p.unit}</h3>
          <Chart data={records} y="peso" />
        </section>
        <section className="card">
          <h3>Máximo de repeticiones por sesión</h3>
          <Chart data={records} y="reps" />
        </section>
        <section className="card">
          <h3>Volumen de carga por sesión · kg</h3>
          <Chart
            data={ss.map((s) => ({
              date: fmtDate(s.date),
              value: Math.round(volume(s.entries)),
            }))}
            bar
          />
          <small>Peso × repeticiones, sumado en las series completadas.</small>
        </section>
        <section className="card">
          <h3>Series efectivas por músculo principal</h3>
          <Chart
            data={Array.from(muscles, ([date, value]) => ({ date, value }))}
            bar
          />
          <small>
            Series marcadas con técnica controlada, RIR ≤ 3 y mínimo del rango
            alcanzado. Los músculos secundarios no se suman para evitar contar
            dos veces.
          </small>
        </section>
        <section className="card">
          <h3>Frecuencia y consistencia semanal</h3>
          <Chart
            data={Array.from(weeks, ([date, value]) => ({
              date: fmtDate(date),
              value,
            }))}
            bar
          />
          <small>
            Sesiones completadas por semana. Compara con tus días programados en
            el calendario.
          </small>
        </section>
      </div>
    </>
  );
}
function Calendar({
  routines,
  sessions,
  schedule,
  start,
}: {
  routines: Routine[];
  sessions: Session[];
  schedule: { id: string; routineId: string; date: string }[];
  start: (r: Routine) => void;
}) {
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [move, setMove] = useState<{
    id: string;
    routineId: string;
    date: string;
  } | null>(null);
  const today = dateKey();
  const events = routines.flatMap((r) => {
    const result: { id: string; routineId: string; date: string }[] = [];
    for (let n = 1; n <= 31; n++) {
      const d = new Date(month.getFullYear(), month.getMonth(), n);
      if (d.getMonth() !== month.getMonth()) break;
      if (d.getDay() === r.day) {
        const key = `${r.id}:${dateKey(d)}`;
        result.push(
          schedule.find((s) => s.id === key) ?? {
            id: key,
            routineId: r.id,
            date: dateKey(d),
          },
        );
      }
    }
    return result;
  });
  schedule.forEach((s) => {
    if (
      s.date.startsWith(dateKey(month).slice(0, 7)) &&
      !events.some((e) => e.id === s.id)
    )
      events.push(s);
  });
  const cells: (number | null)[] = [
    ...Array.from({ length: (month.getDay() + 6) % 7 }, () => null),
    ...Array.from(
      {
        length: new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0,
        ).getDate(),
      },
      (_, i) => i + 1,
    ),
  ];
  return (
    <>
      <Heading
        title="Haz espacio para ti."
        sub="Programado no significa completado. Tu historial siempre depende de lo que registres."
      />
      <section className="card">
        <div className="row spread">
          <button
            className="icon"
            aria-label="Mes anterior"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft />
          </button>
          <h2>
            {month.toLocaleDateString("es", { month: "long", year: "numeric" })}
          </h2>
          <button
            className="icon"
            aria-label="Mes siguiente"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight />
          </button>
        </div>
        <div className="calendar-grid">
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <div className="calendar-label" key={i}>
              {d}
            </div>
          ))}
          {cells.map((n, i) => {
            const key = n
              ? dateKey(new Date(month.getFullYear(), month.getMonth(), n))
              : "";
            const planned = events.filter((e) => e.date === key);
            const done = sessions.filter((s) => s.date === key);
            return (
              <div
                className={"calendar-cell " + (key === today ? "is-today" : "")}
                key={i}
              >
                {n && (
                  <>
                    <b>{n}</b>
                    {done.map((s) => (
                      <span className="cal-done" key={s.id}>
                        ✓ {s.name}
                      </span>
                    ))}
                    {planned
                      .filter(
                        (e) => !done.some((s) => s.routineId === e.routineId),
                      )
                      .map((e) => (
                        <button
                          className={key < today ? "cal-pending" : "cal-plan"}
                          key={e.id}
                          onClick={() => setMove({ ...e })}
                        >
                          {routines.find((r) => r.id === e.routineId)?.name}
                          <small>
                            {key < today ? "Pendiente" : "Programado"}
                          </small>
                        </button>
                      ))}
                    {!planned.length && !done.length && (
                      <span className="cal-rest">Descanso</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="calendar-legend">
          <span>🔵 Programado</span>
          <span>🟢 Completado</span>
          <span>🟠 Pendiente</span>
          <span>Descanso</span>
        </div>
      </section>
      {move && (
        <Modal title="Reprogramar sesión" close={() => setMove(null)}>
          <p>
            Se moverá esta sesión, conservando su identidad y sin duplicarla.
          </p>
          <label className="field">
            Nueva fecha
            <input
              type="date"
              value={move.date}
              onChange={(e) => setMove({ ...move, date: e.target.value })}
            />
          </label>
          <button
            className="primary full"
            disabled={!move.date}
            onClick={async () => {
              await db.schedule.put(move);
              setMove(null);
            }}
          >
            Guardar fecha
          </button>
          {move.date === today && (
            <button
              className="secondary full"
              onClick={() => {
                const r = routines.find((x) => x.id === move.routineId);
                if (r) start(r);
                setMove(null);
              }}
            >
              Entrenar ahora
            </button>
          )}
        </Modal>
      )}
    </>
  );
}
function LibraryView() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const e = selected ? exercise(selected) : null;
  return (
    <>
      <Heading
        title="Entiende cada movimiento."
        sub="Técnica, músculos y alternativas. Todo disponible sin conexión."
      />
      <input
        className="search"
        aria-label="Buscar ejercicio o músculo"
        placeholder="Buscar ejercicio o músculo…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="library-grid">
        {exercises
          .filter((e) =>
            (e.name + " " + e.muscle)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((e) => (
            <button
              className="card library-item"
              key={e.id}
              onClick={() => setSelected(e.id)}
            >
              <ExerciseArt id={e.id} />
              <span className="mini-label">{e.muscle}</span>
              <h3>{e.name}</h3>
              <small>{e.equipment}</small>
              <ArrowUpRight size={17} />
            </button>
          ))}
      </div>
      {e && (
        <Modal title={e.name} close={() => setSelected(null)}>
          <div className="large-art">
            <ExerciseArt id={e.id} />
          </div>
          <p>
            <b>Principal:</b> {e.muscle}
            <br />
            <b>Secundarios:</b> {e.secondary}
            <br />
            <b>Equipo:</b> {e.equipment}
          </p>
          <h3>Paso a paso</h3>
          <ol>
            {e.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h3>Errores comunes</h3>
          <p>{e.errors}</p>
          <h3>Alternativas</h3>
          {e.alternatives.map((a) => (
            <button
              className="alternative"
              key={a}
              onClick={() => setSelected(a)}
            >
              {exercise(a).name}
              <ArrowRight size={16} />
            </button>
          ))}
          <small>
            Ilustración esquemática original; consulta las instrucciones de cada
            movimiento.
          </small>
        </Modal>
      )}
    </>
  );
}
function SettingsView({
  p,
  save,
  notify,
  tutorial,
}: {
  p: Profile;
  save: (p: Profile) => Promise<void>;
  notify: (s: string) => void;
  tutorial: () => void;
}) {
  const [draft, setDraft] = useState(p);
  const [incrementId, setIncrementId] = useState("e0");
  const [pending, setPending] = useState<unknown>(null);
  const [err, setErr] = useState("");
  const [target, setTarget] = useState(60);
  const [bar, setBar] = useState(20);
  const [convert, setConvert] = useState(20);
  const [persisted, setPersisted] = useState<string>("");
  const plates: number[] = [];
  let remain = Math.max(0, (target - bar) / 2);
  for (const disc of [25, 20, 15, 10, 5, 2.5, 1.25])
    while (remain >= disc) {
      plates.push(disc);
      remain -= disc;
    }
  return (
    <>
      <Heading
        title="Hecho a tu medida."
        sub="Tu perfil, tus objetivos y el control de tus datos."
      />
      <div className="two-columns">
        <section className="card">
          <h3>Perfil y objetivos</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await save(draft);
              notify("Perfil guardado");
            }}
          >
            <label className="field">
              Tu nombre
              <input
                required
                maxLength={40}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <Field
                label="Peso inicial (lb)"
                min={45}
                max={1100}
                step={0.1}
                value={+lb(draft.startKg).toFixed(1)}
                onChange={(v) => setDraft({ ...draft, startKg: kg(v) })}
              />
              <Field
                label="Peso objetivo (lb)"
                min={45}
                max={1100}
                step={0.1}
                value={+lb(draft.goalKg).toFixed(1)}
                onChange={(v) => setDraft({ ...draft, goalKg: kg(v) })}
              />
              <Field
                label="Estatura (cm)"
                min={50}
                max={260}
                value={draft.height}
                onChange={(v) => setDraft({ ...draft, height: v })}
              />
              <Field
                label="Calorías / día"
                min={500}
                max={10000}
                value={draft.calories}
                onChange={(v) => setDraft({ ...draft, calories: v })}
              />
              <Field
                label="Proteínas (g / día)"
                max={500}
                value={draft.protein}
                onChange={(v) => setDraft({ ...draft, protein: v })}
              />
              <label className="field">
                Unidad de peso
                <select
                  value={draft.unit}
                  onChange={(e) =>
                    setDraft({ ...draft, unit: e.target.value as "kg" | "lb" })
                  }
                >
                  <option>lb</option>
                  <option>kg</option>
                </select>
              </label>
            </div>
            <button className="primary full" type="submit">
              Guardar perfil
            </button>
          </form>
        </section>
        <section className="card">
          <h3>Copias de seguridad</h3>
          <p>
            Tus registros viven en IndexedDB, en este navegador. No se envían a
            un servidor ni se sincronizan entre dispositivos.
          </p>
          <div className="notice">
            Borrar datos del navegador, desinstalar la app o la limpieza
            automática del sistema puede eliminar tus registros. Exporta copias
            con frecuencia.
          </div>
          <button
            className="secondary full"
            onClick={async () =>
              download(
                `hypertrophy-${dateKey()}.json`,
                JSON.stringify(await backup(), null, 2),
              )
            }
          >
            <ArrowDownToLine size={17} />
            Exportar todos mis datos (JSON)
          </button>
          <button
            className="secondary full"
            onClick={async () =>
              download(
                "hypertrophy-historial.csv",
                csv(await db.sessions.toArray()),
                "text/csv;charset=utf-8",
              )
            }
          >
            <ArrowDownToLine size={17} />
            Exportar historial (CSV)
          </button>
          <label className="import-button">
            Importar copia JSON
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                try {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 25 * 1024 * 1024)
                    throw Error("El archivo supera 25 MB.");
                  const value: unknown = JSON.parse(await f.text());
                  validateBackup(value);
                  setPending(value);
                  setErr("");
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Archivo inválido");
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
          {err && (
            <p role="alert" className="error">
              {err}
            </p>
          )}
          <button
            className="text-button"
            onClick={async () => {
              const result = await navigator.storage?.persist?.();
              setPersisted(
                result
                  ? "Almacenamiento persistente concedido."
                  : "El navegador decide la retención. Mantén tus copias JSON.",
              );
            }}
          >
            Solicitar almacenamiento persistente
          </button>
          <small>{persisted}</small>
        </section>
        <section className="card">
          <h3>Calculadora de discos · kg</h3>
          <div className="row">
            <Field
              label="Peso total objetivo"
              value={target}
              max={500}
              step={2.5}
              onChange={setTarget}
            />
            <Field
              label="Peso de la barra"
              value={bar}
              max={50}
              step={0.5}
              onChange={setBar}
            />
          </div>
          <p>En cada lado:</p>
          <div className="plates">
            {plates.length ? (
              plates.map((n, i) => <span key={i}>{n}</span>)
            ) : (
              <small>Sin discos</small>
            )}
          </div>
          <p>
            {target < bar
              ? "La barra supera el peso objetivo."
              : remain
                ? `Faltan ${(remain * 2).toFixed(2)} kg para el objetivo con estos discos.`
                : `Total: ${target} kg, incluida la barra.`}
          </p>
          <small>
            Discos disponibles: 25, 20, 15, 10, 5, 2.5 y 1.25 kg. Se asume
            disponibilidad suficiente por lado.
          </small>
        </section>
        <section className="card">
          <h3>Incrementos disponibles por ejercicio</h3>
          <p>En kg. Se usarán en las sugerencias de tu próxima sesión.</p>
          <select
            aria-label="Elegir ejercicio para incremento"
            id="increment-exercise"
            onChange={(e) => setIncrementId(e.target.value)}
            value={incrementId}
          >
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <Field
            label="Incremento (kg)"
            min={0.1}
            max={100}
            step={0.1}
            value={
              draft.increments[incrementId] ?? exercise(incrementId).increment
            }
            onChange={(v) =>
              setDraft({
                ...draft,
                increments: { ...draft.increments, [incrementId]: v },
              })
            }
          />
          <button
            className="secondary full"
            onClick={async () => {
              await save(draft);
              notify("Incrementos guardados");
            }}
          >
            Guardar incrementos
          </button>
          <h3 style={{ marginTop: 25 }}>Conversión y ayuda</h3>
          <Field
            label="Kilogramos"
            value={convert}
            step={0.1}
            onChange={setConvert}
          />
          <div className="metric-value">
            {lb(convert).toFixed(2)}
            <span>lb</span>
          </div>
          <button className="secondary full" onClick={tutorial}>
            Ver tutorial e instalación
          </button>
          <div className="notice">
            <WifiOff size={20} />
            Offline tras descargar los recursos por primera vez mediante HTTPS.
            No se necesita cuenta.
          </div>
        </section>
      </div>
      {pending && (
        <Modal
          title="¿Reemplazar todos tus datos?"
          close={() => setPending(null)}
        >
          <p>
            La copia ha pasado la validación. Importarla reemplazará tu perfil,
            rutinas, historial y registros actuales. Exporta antes una copia si
            deseas conservarlos.
          </p>
          <button
            className="secondary full"
            onClick={async () =>
              download(
                `hypertrophy-antes-importar-${dateKey()}.json`,
                JSON.stringify(await backup(), null, 2),
              )
            }
          >
            Exportar datos actuales
          </button>
          <button
            className="primary full"
            onClick={async () => {
              try {
                await restore(pending);
                setPending(null);
                notify("Copia restaurada. Los datos ya están guardados.");
              } catch (e) {
                setErr(String(e));
                setPending(null);
              }
            }}
          >
            Confirmar reemplazo
          </button>
        </Modal>
      )}
    </>
  );
}
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="loading">
        No se pudo mostrar la aplicación.
        <span>Tus datos permanecen en este dispositivo.</span>
        <button onClick={() => location.reload()}>Volver a abrir</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
