import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { DEFAULT_LANGUAGE, LANGUAGES } from './languages'

type Messages = Record<string, unknown>
type TranslationTree = Record<string, unknown>
interface LanguageFile {
  default: Messages
}

/** 语言文件路径：`./auth/login/en-us.ts` → 目录 `auth/login`、语言 `en-us` */
const LANGUAGE_FILE = /^\.\/(.+)\/([a-z]{2}-[a-z]{2})\.ts$/
const LOCALES: ReadonlySet<string> = new Set(LANGUAGES)

function nest(tree: TranslationTree, path: string[], value: Messages): void {
  let node = tree

  for (const segment of path.slice(0, -1)) {
    if (typeof node[segment] !== 'object' || node[segment] === null) {
      node[segment] = {}
    }

    node = node[segment] as TranslationTree
  }

  const leaf = path.at(-1)

  if (leaf) {
    node[leaf] = value
  }
}

/** 把所有语言文件拼成 i18next 的 resources；目录与命名约定见 frontend.md「文案（i18n）」。 */
function buildResources(files: Record<string, LanguageFile>) {
  const resources: Record<string, { translation: TranslationTree }> = {}

  for (const locale of LANGUAGES) {
    resources[locale] = { translation: {} }
  }

  for (const [path, module] of Object.entries(files)) {
    const match = LANGUAGE_FILE.exec(path)

    if (!match) continue

    const [, directory, locale] = match

    // 只认 languages.ts 里声明过的语言，config.ts / languages.ts 等非语言文件自动被忽略
    if (!directory || !locale || !LOCALES.has(locale)) continue

    nest(resources[locale].translation, directory.split('/'), module.default)
  }

  return resources
}

const resources = buildResources(
  import.meta.glob<LanguageFile>('./**/*.ts', { eager: true }),
)

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  // i18next 默认会把语言码规范成 `en-US`（region 大写）后去查 resources，而这里（文件名、
  // LANGUAGES、目录结构）统一用小写 `en-us`；不打开这个开关 t() 会直接返回 key 本身。
  lowerCaseLng: true,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
