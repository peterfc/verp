import type React from "react"

export default function SetupPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="setup-password-layout">
      {children}
    </div>
  )
}
