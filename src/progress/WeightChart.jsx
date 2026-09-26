import { useEffect, useRef, useState } from "react";
import { parseKey, toNumber } from "./motivation";
import "./Progress.css";

const PAD = { top: 16, right: 16, bottom: 30, left: 44 };

// Width of an element in CSS pixels, kept up to date.
function useWidth(ref, fallback) {
    const [width, setWidth] = useState(fallback);

    useEffect(() => {
        const element = ref.current;
        if (!element || typeof ResizeObserver === "undefined") return undefined;

        const observer = new ResizeObserver(([entry]) => {
            const next = Math.round(entry.contentRect.width);
            if (next > 0) setWidth(next);
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return width;
}

function shortDate(key) {
    return parseKey(key).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/*
 * Body-weight line chart (plain SVG). Dates are placed by time, so gaps
 * between readings show as gaps. Optional dashed target line.
 */
function WeightChart({ entries, target }) {
    // Drawn at the real width, so labels stay 12px on phones too.
    const boxRef = useRef(null);
    const WIDTH = Math.max(260, useWidth(boxRef, 640));
    const HEIGHT = WIDTH < 480 ? 200 : 240;

    const points = entries
        .map((entry) => ({ date: entry.date, kg: toNumber(entry.weightKg), time: parseKey(entry.date).getTime() }))
        .filter((point) => point.kg);

    if (points.length === 0) {
        return (
            <div ref={boxRef}>
                <p className="wt-pr-muted">No weight readings in this period yet.</p>
            </div>
        );
    }

    const targetKg = toNumber(target);
    const values = points.map((point) => point.kg).concat(targetKg ? [targetKg] : []);
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Keep a readable range even when the weight barely changes.
    if (max - min < 2) {
        const middle = (max + min) / 2;
        min = middle - 1;
        max = middle + 1;
    }

    const padding = (max - min) * 0.12;
    min = Math.floor((min - padding) * 2) / 2;
    max = Math.ceil((max + padding) * 2) / 2;

    const first = points[0].time;
    const last = points[points.length - 1].time;
    const span = Math.max(1, last - first);
    const innerWidth = WIDTH - PAD.left - PAD.right;
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;

    const x = (time) => (points.length === 1 ? PAD.left + innerWidth / 2 : PAD.left + ((time - first) / span) * innerWidth);
    const y = (kg) => PAD.top + (1 - (kg - min) / (max - min)) * innerHeight;

    const line = points.map((point) => `${x(point.time).toFixed(1)},${y(point.kg).toFixed(1)}`).join(" ");
    const area =
        points.length > 1
            ? `M ${x(first)},${PAD.top + innerHeight} L ${line.replace(/ /g, " L ")} L ${x(last)},${PAD.top + innerHeight} Z`
            : null;

    const ticks = [0, 0.5, 1].map((fraction) => Math.round((min + (max - min) * fraction) * 10) / 10);
    const lowest = points.reduce((a, b) => (b.kg < a.kg ? b : a));
    const highest = points.reduce((a, b) => (b.kg > a.kg ? b : a));

    return (
        <div ref={boxRef}>
        <svg
            className="wt-pr-chart"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Weight from ${shortDate(points[0].date)} to ${shortDate(points[points.length - 1].date)}: ` +
                `lowest ${lowest.kg} kg, highest ${highest.kg} kg, latest ${points[points.length - 1].kg} kg`}
        >
            {ticks.map((tick) => (
                <g key={tick}>
                    <line className="wt-pr-chart-grid" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} />
                    <text className="wt-pr-chart-text" x={PAD.left - 8} y={y(tick) + 4} textAnchor="end">{tick}</text>
                </g>
            ))}

            {area && <path className="wt-pr-chart-area" d={area} />}

            {targetKg && targetKg >= min && targetKg <= max && (
                <g>
                    <line className="wt-pr-chart-target" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(targetKg)} y2={y(targetKg)} />
                    <text className="wt-pr-chart-text" x={WIDTH - PAD.right} y={y(targetKg) - 6} textAnchor="end">
                        target {targetKg}
                    </text>
                </g>
            )}

            {points.length > 1 && <polyline className="wt-pr-chart-line" points={line} />}

            {points.map((point) => (
                <circle key={point.date} className="wt-pr-chart-point" cx={x(point.time)} cy={y(point.kg)} r={points.length > 40 ? 2.5 : 4}>
                    <title>{`${shortDate(point.date)}: ${point.kg} kg`}</title>
                </circle>
            ))}

            <text className="wt-pr-chart-text" x={PAD.left} y={HEIGHT - 8} textAnchor="start">
                {shortDate(points[0].date)}
            </text>
            {points.length > 1 && (
                <text className="wt-pr-chart-text" x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end">
                    {shortDate(points[points.length - 1].date)}
                </text>
            )}
        </svg>
        </div>
    );
}

export default WeightChart;
