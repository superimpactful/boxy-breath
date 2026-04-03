import { useState, useEffect, useRef } from "react";

const PHASES = [
  { label: "Inhale", duration: 5, color: "#009BDD" },
  { label: "Hold", duration: 5, color: "#F00F28" },
  { label: "Exhale", duration: 5, color: "#009BDD" },
  { label: "Hold", duration: 5, color: "#F00F28" },
];

const TOTAL_BREATHS = 10;

export default function BoxBreathing() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [tick, setTick] = useState(0); // 0..duration-1
  const [breath, setBreath] = useState(1);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const phase = PHASES[phaseIndex];
  const progress = tick / phase.duration; // 0..1
  const secondsLeft = phase.duration - tick;

  // Box corner positions (normalized 0..1)
  const boxPoints = [
    { x: 0.15, y: 0.15 }, // top-left
    { x: 0.85, y: 0.15 }, // top-right
    { x: 0.85, y: 0.85 }, // bottom-right
    { x: 0.15, y: 0.85 }, // bottom-left
  ];

  // Total ticks per full cycle
  const cycleLength = PHASES.reduce((a, p) => a + p.duration, 0); // 20

  // Dot position: travels around the box perimeter
  // Phase 0 (Inhale): top-left → top-right
  // Phase 1 (Hold): top-right → bottom-right
  // Phase 2 (Exhale): bottom-right → bottom-left
  // Phase 3 (Hold): bottom-left → top-left
  function getDotPos() {
    const t = progress;
    const [from, to] = [boxPoints[phaseIndex], boxPoints[(phaseIndex + 1) % 4]];
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  }

  const dot = getDotPos();

  useEffect(() => {
    if (!running || done) return;
    intervalRef.current = setInterval(() => {
      setTick((prev) => {
        const next = prev + 1;
        if (next >= phase.duration) {
          // Advance phase
          const nextPhase = (phaseIndex + 1) % PHASES.length;
          setPhaseIndex(nextPhase);
          setTick(0);
          // If we completed phase 3 (second hold), increment breath
          if (phaseIndex === 3) {
            setBreath((b) => {
              if (b >= TOTAL_BREATHS) {
                setDone(true);
                setRunning(false);
              }
              return b + 1;
            });
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phaseIndex, phase.duration, done]);

  function handleStart() {
    setRunning(true);
    setDone(false);
    setPhaseIndex(0);
    setTick(0);
    setBreath(1);
  }

  function handleReset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setDone(false);
    setPhaseIndex(0);
    setTick(0);
    setBreath(1);
  }

  // SVG box size
  const S = 280;
  const dotX = dot.x * S;
  const dotY = dot.y * S;

  // Box stroke dash for progress around perimeter
  // Perimeter = 4 sides, each side length = (0.85-0.15)*S = 0.7*280 = 196
  const sideLen = (0.85 - 0.15) * S; // 196
  const perimeter = sideLen * 4; // 784
  const phaseOffset = phaseIndex * sideLen;
  const dashProgress = phaseOffset + progress * sideLen;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#e8e4df",
        padding: "24px",
        userSelect: "none",
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: "8px", letterSpacing: "0.25em", fontSize: "11px", textTransform: "uppercase", color: "#666", fontFamily: "monospace" }}>
        Box Breathing
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#444",
          marginBottom: "40px",
          letterSpacing: "0.1em",
          fontFamily: "monospace",
        }}
      >
        {running || done
          ? `Breath ${Math.min(breath, TOTAL_BREATHS)} of ${TOTAL_BREATHS}`
          : `${TOTAL_BREATHS} breaths · 5 sec each phase`}
      </div>

      {/* SVG Box */}
      <div style={{ position: "relative", marginBottom: "36px" }}>
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          {/* Background box */}
          <rect
            x={0.15 * S}
            y={0.15 * S}
            width={sideLen}
            height={sideLen}
            fill="none"
            stroke="#1e1e2e"
            strokeWidth="2"
          />

          {/* Progress arc around box */}
          {running && !done && (
            <rect
              x={0.15 * S}
              y={0.15 * S}
              width={sideLen}
              height={sideLen}
              fill="none"
              stroke={phase.color}
              strokeWidth="2"
              strokeOpacity="0.35"
              strokeDasharray={`${dashProgress} ${perimeter}`}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.9s linear" }}
            />
          )}

          {/* Corner dots */}
          {boxPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x * S}
              cy={p.y * S}
              r="4"
              fill={running && !done ? phase.color : "#2a2a3a"}
              fillOpacity={running && !done ? 0.6 : 1}
            />
          ))}

          {/* Phase labels on sides */}
          {[
            { label: "Inhale", x: S / 2, y: 0.08 * S, anchor: "middle" },
            { label: "Hold", x: 0.93 * S, y: S / 2, anchor: "middle" },
            { label: "Exhale", x: S / 2, y: 0.94 * S, anchor: "middle" },
            { label: "Hold", x: 0.07 * S, y: S / 2, anchor: "middle" },
          ].map((item, i) => (
            <text
              key={i}
              x={item.x}
              y={item.y}
              textAnchor={item.anchor}
              fontSize="9"
              fill={running && phaseIndex === i ? phase.color : "#333"}
              letterSpacing="0.15em"
              style={{ textTransform: "uppercase", fontFamily: "monospace", transition: "fill 0.3s" }}
            >
              {item.label.toUpperCase()}
            </text>
          ))}

          {/* Moving dot */}
          {running && !done && (
            <circle
              cx={dotX}
              cy={dotY}
              r="7"
              fill={phase.color}
              style={{ filter: `drop-shadow(0 0 8px ${phase.color})`, transition: "cx 0.9s linear, cy 0.9s linear" }}
            />
          )}

          {/* Center display */}
          <text
            x={S / 2}
            y={S / 2 - 14}
            textAnchor="middle"
            fontSize={done ? "13" : "36"}
            fill={done ? "#009BDD" : "#e8e4df"}
            fontFamily="monospace"
            letterSpacing={done ? "0.1em" : "0"}
          >
            {done ? "COMPLETE" : running ? secondsLeft : ""}
          </text>
          {running && !done && (
            <text
              x={S / 2}
              y={S / 2 + 16}
              textAnchor="middle"
              fontSize="10"
              fill={phase.color}
              fontFamily="monospace"
              letterSpacing="0.2em"
            >
              {phase.label.toUpperCase()}
            </text>
          )}
          {!running && !done && (
            <text
              x={S / 2}
              y={S / 2 + 6}
              textAnchor="middle"
              fontSize="10"
              fill="#333"
              fontFamily="monospace"
              letterSpacing="0.15em"
            >
              READY
            </text>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "16px" }}>
        {!running && !done && (
          <button
            onClick={handleStart}
            style={{
              background: "transparent",
              border: "1px solid #009BDD",
              color: "#009BDD",
              padding: "10px 32px",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => { e.target.style.background = "#009BDD"; e.target.style.color = "#0a0a0f"; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#009BDD"; }}
          >
            Begin
          </button>
        )}
        {running && (
          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "1px solid #333",
              color: "#555",
              padding: "10px 32px",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Stop
          </button>
        )}
        {done && (
          <button
            onClick={handleReset}
            style={{
              background: "transparent",
              border: "1px solid #009BDD",
              color: "#009BDD",
              padding: "10px 32px",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
            onMouseEnter={(e) => { e.target.style.background = "#009BDD"; e.target.style.color = "#0a0a0f"; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#009BDD"; }}
          >
            Again
          </button>
        )}
      </div>
    </div>
  );
}
