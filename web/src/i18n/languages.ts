/** 支持的语言。新增语言：这里加一项，再在每个文案目录下加一个同名文件。 */
export const LANGUAGES = ['en-us', 'zh-cn'] as const
export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'en-us'
