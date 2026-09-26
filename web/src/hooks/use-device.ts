import { useEffect, useState } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type OSName = 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown'
export type BrowserName =
  | 'chrome'
  | 'safari'
  | 'firefox'
  | 'edge'
  | 'opera'
  | 'samsung'
  | 'unknown'

const TABLET_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024

function getDeviceType(width: number): DeviceType {
  if (width < TABLET_BREAKPOINT) return 'mobile'
  if (width < DESKTOP_BREAKPOINT) return 'tablet'
  return 'desktop'
}

function getScreenSize() {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 }
  }

  return { width: window.innerWidth, height: window.innerHeight }
}

function getUserAgent() {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent
}

function detectOS(userAgent: string): OSName {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  if (/Mac OS X|Macintosh/i.test(userAgent)) {
    // iPadOS in desktop mode reports "Macintosh" but exposes touch points.
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) {
      return 'ios'
    }
    return 'macos'
  }
  if (/Windows/i.test(userAgent)) return 'windows'
  if (/Android/i.test(userAgent)) return 'android'
  if (/Linux/i.test(userAgent)) return 'linux'
  return 'unknown'
}

function detectBrowser(userAgent: string): BrowserName {
  if (/Edg\//.test(userAgent)) return 'edge'
  if (/OPR\//.test(userAgent) || /Opera/i.test(userAgent)) return 'opera'
  if (/SamsungBrowser\//.test(userAgent)) return 'samsung'
  if (/Firefox\//.test(userAgent)) return 'firefox'
  if (/Chrome\//.test(userAgent)) return 'chrome'
  if (/Safari\//.test(userAgent)) return 'safari'
  return 'unknown'
}

export interface DeviceInfo {
  deviceType: DeviceType
  screen: { width: number; height: number }
  os: OSName
  browser: BrowserName
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export function useDevice(): DeviceInfo {
  const [screen, setScreen] = useState(getScreenSize)
  const [os] = useState<OSName>(() => detectOS(getUserAgent()))
  const [browser] = useState<BrowserName>(() => detectBrowser(getUserAgent()))

  useEffect(() => {
    const onChange = () => setScreen(getScreenSize())
    window.addEventListener('resize', onChange)
    return () => window.removeEventListener('resize', onChange)
  }, [])

  const deviceType = getDeviceType(screen.width)

  return {
    deviceType,
    screen,
    os,
    browser,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  }
}

export function useDeviceType(): DeviceType {
  return useDevice().deviceType
}

export function useIsMobile() {
  return useDevice().isMobile
}

export function useIsTablet() {
  return useDevice().isTablet
}

export function useIsDesktop() {
  return useDevice().isDesktop
}
