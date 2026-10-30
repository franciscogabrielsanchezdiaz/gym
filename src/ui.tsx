import type { ReactNode } from "react";
import { Activity, X } from "lucide-react";
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
import { exercise } from "./model";
export function Field({
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          if (e.target.value !== "" && Number.isFinite(+e.target.value))
            onChange(Math.min(max, Math.max(min, +e.target.value)));
        }}
      />
    </label>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <div className="overlay" onClick={close}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row spread">
          <h2>{title}</h2>
          <button className="icon" aria-label="Cerrar" onClick={close}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Activity size={30} />
      <p>{text}</p>
      <small>Cada registro es un paso hacia tu objetivo.</small>
    </div>
  );
}
export function Chart({
  data,
  x = "date",
  y = "value",
  bar = false,
}: {
  data: Record<string, string | number>[];
  x?: string;
  y?: string;
  bar?: boolean;
}) {
  return data.length ? (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        {bar ? (
          <BarChart data={data}>
            <CartesianGrid stroke="#242831" vertical={false} />
            <XAxis dataKey={x} stroke="#747d8d" fontSize={11} />
            <YAxis stroke="#747d8d" width={45} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#191e27",
                border: "1px solid #343e4f",
                borderRadius: 10,
              }}
            />
            <Bar dataKey={y} fill="#4b8cff" radius={[5, 5, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#4388ff" stopOpacity={0.35} />
                <stop offset="1" stopColor="#4388ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#242831" vertical={false} />
            <XAxis dataKey={x} stroke="#747d8d" fontSize={11} />
            <YAxis
              stroke="#747d8d"
              domain={["auto", "auto"]}
              width={45}
              fontSize={11}
            />
            <Tooltip
              contentStyle={{
                background: "#191e27",
                border: "1px solid #343e4f",
                borderRadius: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey={y}
              stroke="#4b8cff"
              strokeWidth={3}
              fill="url(#blue)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  ) : (
    <Empty text="Tus próximos registros darán forma a este gráfico." />
  );
}
export function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">HYPERTROPHY / TU ESPACIO</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  );
}
export function Metric({
  icon,
  label,
  value,
  unit,
  detail,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  detail: string;
  action: () => void;
}) {
  return (
    <button className="card metric" onClick={action}>
      <div className="row spread">
        <span className="mini-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <small>{detail}</small>
    </button>
  );
}
export function ExerciseArt({ id }: { id: string }) {
  const e = exercise(id);
  return (
    <svg
      viewBox="0 0 120 100"
      role="img"
      aria-label={`Ilustración: ${e.muscle}`}
    >
      <defs>
        <linearGradient id={"g" + id}>
          <stop stopColor="#5298ff" />
          <stop offset="1" stopColor="#2459c5" />
        </linearGradient>
      </defs>
      <path
        d="M12 85H108M23 85V52M22 54H70M80 85V46"
        stroke="#414d60"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="61" cy="22" r="9" fill="#94aac8" />
      <path
        d="M59 35L52 58L79 65L88 84M52 58L38 80M58 38L36 40L24 27M61 39L81 40L95 26"
        fill="none"
        stroke={"url(#g" + id + ")"}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 22L31 30M89 29L104 22" stroke="#a3b5cc" strokeWidth="8" />
      <path
        d="M18 16L11 28M35 24L28 36M86 24L94 36M100 16L108 28"
        stroke="#536a8d"
        strokeWidth="7"
      />
    </svg>
  );
}
