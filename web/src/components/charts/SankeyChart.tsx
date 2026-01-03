type SankeyJob = { status: string }

interface SankeyChartProps {
  jobs: SankeyJob[];
}

interface Node {
  name: string;
  color: string;
}

interface Link {
  source: number;
  target: number;
  value: number;
}

// Compact, self-drawn Sankey using SVG. Adapts to the statuses we support.
export function SankeyChart({ jobs }: SankeyChartProps) {
  const normalize = (s: string) => (s || '').toLowerCase();

  // Count jobs by status with our vocab
  const statusCounts = {
    saved: jobs.filter((j) => normalize(j.status) === 'saved').length,
    applied: jobs.filter((j) => normalize(j.status) === 'applied').length,
    oa: jobs.filter((j) => normalize(j.status) === 'oa').length,
    interview: jobs.filter((j) => normalize(j.status) === 'interview').length,
    final: jobs.filter((j) => normalize(j.status) === 'final').length,
    offer: jobs.filter((j) => normalize(j.status) === 'offer').length,
    rejected: jobs.filter((j) => normalize(j.status) === 'rejected').length,
  };

  const total = jobs.length;

  // Define nodes
  const nodes: Node[] = [
    { name: 'Total Jobs', color: '#3b82f6' },
    { name: 'Saved', color: '#64748b' },
    { name: 'Applied', color: '#0ea5e9' },
    { name: 'OA', color: '#a855f7' },
    { name: 'Interview', color: '#8b5cf6' },
    { name: 'Final', color: '#f59e0b' },
    { name: 'Offered', color: '#10b981' },
    { name: 'Rejected', color: '#f43f5e' },
  ];

  // Define links (flows)
  const links: Link[] = [
    { source: 0, target: 1, value: statusCounts.saved },
    { source: 0, target: 2, value: statusCounts.applied },
    { source: 2, target: 3, value: statusCounts.oa },
    { source: 2, target: 4, value: statusCounts.interview },
    { source: 4, target: 5, value: statusCounts.final },
    { source: 5, target: 6, value: statusCounts.offer },
    { source: 4, target: 7, value: statusCounts.rejected },
  ].filter((link) => link.value > 0);

  const maxValue = links.length ? Math.max(...links.map((l) => l.value), 1) : 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="relative h-72">
        {links.length === 0 ? (
          <div className="text-sm text-slate-500 p-3">Not enough data yet</div>
        ) : (
          <svg width="100%" height="100%" className="overflow-visible">
            {links.map((link, i) => {
              const sourceY = link.source === 0 ? 40 : 120 + (link.source - 1) * 44;
              const targetY = 120 + (link.target - 1) * 44;
              const width = (link.value / maxValue) * 40 + 4;
              return (
                <g key={i}>
                  <path
                    d={`M 140 ${sourceY} C 260 ${sourceY}, 260 ${targetY}, 380 ${targetY}`}
                    fill="none"
                    stroke={nodes[link.source].color}
                    strokeWidth={width}
                    opacity="0.35"
                  />
                </g>
              );
            })}

            {nodes.map((node, i) => {
              const y = i === 0 ? 40 : 120 + (i - 1) * 44;
              const x = i === 0 ? 140 : 380;
              const countsArr = [
                statusCounts.saved,
                statusCounts.applied,
                statusCounts.oa,
                statusCounts.interview,
                statusCounts.final,
                statusCounts.offer,
                statusCounts.rejected,
              ];
              const count = i === 0 ? total : countsArr[i - 1];
              if (i > 0 && count === 0) return null;
              return (
                <g key={i}>
                  <rect x={x - 55} y={y - 16} width="110" height="32" rx="8" fill={node.color} />
                  <text
                    x={x}
                    y={y - 2}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {node.name}
                  </text>
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="700"
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Saved', count: statusCounts.saved, color: '#64748b' },
          { label: 'Applied', count: statusCounts.applied, color: '#0ea5e9' },
          { label: 'OA', count: statusCounts.oa, color: '#a855f7' },
          { label: 'Interview', count: statusCounts.interview, color: '#8b5cf6' },
          { label: 'Final', count: statusCounts.final, color: '#f59e0b' },
          { label: 'Offered', count: statusCounts.offer, color: '#10b981' },
          { label: 'Rejected', count: statusCounts.rejected, color: '#f43f5e' },
        ].map((item) => (
          <div key={item.label} className="text-center text-xs">
            <div className="flex items-center justify-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600">{item.label}</span>
              <span className="font-semibold text-slate-900">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

