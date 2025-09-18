/**
 * Конвертирует Markdown текст в обычный текст без форматирования
 */
export function markdownToText(markdown: string): string {
  if (!markdown) return ''

  return markdown
    // Удаляем заголовки (# ## ### ####)
    .replace(/^#{1,6}\s+/gm, '')
    
    // Удаляем жирный текст (**text** или __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    
    // Удаляем курсив (*text* или _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    
    // Удаляем зачеркнутый текст (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    
    // Удаляем ссылки [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    
    // Удаляем изображения ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    
    // Удаляем код в блоках (```code```)
    .replace(/```[\s\S]*?```/g, '')
    
    // Удаляем инлайн код (`code`)
    .replace(/`([^`]+)`/g, '$1')
    
    // Удаляем горизонтальные линии (--- или ***)
    .replace(/^[-*_]{3,}$/gm, '')
    
    // Удаляем списки (- item или * item или 1. item)
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    
    // Удаляем цитаты (> text)
    .replace(/^>\s*/gm, '')
    
    // Удаляем таблицы (| col1 | col2 |)
    .replace(/\|/g, ' ')
    
    // Удаляем лишние пробелы и переносы строк
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/**
 * Форматирует текст для PDF с правильными переносами строк
 */
export function formatTextForPDF(text: string, maxLineLength: number = 80): string {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length <= maxLineLength) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Если слово длиннее maxLineLength, добавляем его как есть
        lines.push(word)
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.join('\n')
}
