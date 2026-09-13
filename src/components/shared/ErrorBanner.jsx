// A failed save/sign-in/load must always say so explicitly — never fail
// silently or spin forever. Renders nothing when there's no message.
export function ErrorBanner({ children, className = '' }) {
  if (!children) return null
  return (
    <div
      className={`rounded-md border-l-8 border-danger bg-danger-soft px-5 py-4 text-[1.3rem] leading-snug font-bold text-danger ${className}`}
      role="alert"
    >
      {children}
    </div>
  )
}
