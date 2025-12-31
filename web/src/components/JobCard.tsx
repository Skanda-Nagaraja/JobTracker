import { Job } from '../types'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

export default function JobCard({ job }: { job: Job }) {
  const company = job.company || 'Unknown company'
  const title = job.title || company
  const location = job.location || ''
  const host = safeHost(job.url)
  const date = new Date(job.created_at)
  const dateLabel = isNaN(date.getTime()) ? '' : date.toLocaleDateString()

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <div>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {host ? <Chip size="small" label={host} /> : null}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {company}
            {location ? ` • ${location}` : ''}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
            {job.source ? <Chip size="small" label={`src: ${job.source}`} /> : null}
            {dateLabel ? <Chip size="small" label={`added ${dateLabel}`} /> : null}
          </Stack>
        </div>
        <div>
          <Button
            component="a"
            href={job.url}
            target="_blank"
            variant="contained"
            sx={{ bgcolor: 'primary.main' }}
          >
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function safeHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}


