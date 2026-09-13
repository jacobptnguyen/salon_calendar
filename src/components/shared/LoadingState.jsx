// A calm placeholder, never a blank screen — a blank white page reads as
// broken to a non-technical user, a short message doesn't. Full-screen by
// default; pass `inline` to fill just the area it sits in.
export function LoadingState({ label = 'Loading…', inline = false }) {
  const Tag = inline ? 'div' : 'main'
  return (
    <Tag
      className={`flex items-center justify-center p-6 ${inline ? 'h-full min-h-60' : 'min-h-svh'}`}
      role="status"
    >
      <p className="text-3xl text-ink-muted">{label}</p>
    </Tag>
  )
}
