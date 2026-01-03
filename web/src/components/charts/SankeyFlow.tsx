import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'

export default function SankeyFlow({ links }: { links: Array<{ source: string; target: string; value: number }> }) {
  // Build nodes from links
  const nodeNames = Array.from(new Set(links.flatMap((l) => [l.source, l.target])))
  const nodes = nodeNames.map((name) => ({ name }))
  const dataLinks = links.map((l) => ({
    source: nodeNames.indexOf(l.source),
    target: nodeNames.indexOf(l.target),
    value: l.value,
  }))

  if (!dataLinks.length) {
    return <div style={{ padding: '8px', color: '#6b7280' }}>Not enough data yet</div>
  }

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <Sankey
          data={{ nodes, links: dataLinks }}
          node={{ stroke: '#fff', strokeWidth: 1, nodePadding: 24, nodeWidth: 12 }}
          link={{ stroke: '#6366f1', fill: '#6366f1' }}
          margin={{ right: 120, left: 20 }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  )
}


