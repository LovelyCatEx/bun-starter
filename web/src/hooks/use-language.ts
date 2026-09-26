import { useTranslation } from 'react-i18next'

import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from '@/i18n/languages'

export interface LanguageControls {
  /** 当前语言（归一化到 LANGUAGES 里的值） */
  language: Language
  /** 支持的语言列表，可直接用来渲染切换器 */
  languages: readonly Language[]
  setLanguage: (language: Language) => void
  /** 按 LANGUAGES 的顺序切到下一个（两个语言时就是来回切） */
  toggleLanguage: () => void
  /** i18next 实例，需要 index/格式化时用 */
  i18n: ReturnType<typeof useTranslation>['i18n']
  /** 翻译函数，等价于 useTranslation() 的 t */
  t: ReturnType<typeof useTranslation>['t']
}

function normalize(language: string | undefined): Language {
  if (!language) return DEFAULT_LANGUAGE

  const value = language.toLowerCase()

  // i18next 可能给到 `zh-CN` / `zh-Hans` 这类值：先整体匹配 `zh-cn`，再退到主语言 `zh`
  const exact = LANGUAGES.find((item) => item === value)
  if (exact) return exact

  const primary = value.split('-')[0]
  return (
    LANGUAGES.find((item) => item.split('-')[0] === primary) ?? DEFAULT_LANGUAGE
  )
}

/**
 * 语言切换的统一入口，包一层 `useTranslation`：
 *
 * ```tsx
 * const { t, language, toggleLanguage } = useLanguage()
 * ```
 */
export function useLanguage(): LanguageControls {
  const { t, i18n } = useTranslation()

  const language = normalize(i18n.resolvedLanguage ?? i18n.language)

  return {
    t,
    i18n,
    language,
    languages: LANGUAGES,
    setLanguage: (next) => {
      void i18n.changeLanguage(next)
    },
    toggleLanguage: () => {
      const next = LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length]
      void i18n.changeLanguage(next ?? DEFAULT_LANGUAGE)
    },
  }
}
