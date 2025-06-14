
import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  // Always return false to disable responsive behavior
  // We want desktop layout scaled down instead of responsive design
  return false
}
