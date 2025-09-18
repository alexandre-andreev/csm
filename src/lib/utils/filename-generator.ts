/**
 * Транслитерирует кириллицу в латиницу
 */
function transliterate(text: string): string {
  const cyrillicMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  }
  
  return text.replace(/[а-яёА-ЯЁ]/g, (char) => cyrillicMap[char] || char)
}

/**
 * Генерирует безопасное имя файла из заголовка аннотации
 */
export function generateFileName(title: string, extension: string, date?: Date): string {
  // Получаем дату
  const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  
  // Транслитерируем заголовок в латиницу
  const transliteratedTitle = transliterate(title)
  
  // Очищаем заголовок от служебных символов и знаков препинания
  const cleanTitle = transliteratedTitle
    .replace(/[^\w\s]/g, ' ') // Удаляем все кроме букв, цифр и пробелов
    .replace(/\s+/g, ' ') // Заменяем множественные пробелы на одинарные
    .trim()
  
  // Берем первые 5 слов
  const words = cleanTitle.split(' ').filter(word => word.length > 0).slice(0, 5)
  const shortTitle = words.join('_')
  
  // Если заголовок слишком короткий, добавляем "annotation"
  const finalTitle = shortTitle.length > 3 ? shortTitle : `annotation_${shortTitle}`
  
  // Ограничиваем длину имени файла
  const maxLength = 50
  const truncatedTitle = finalTitle.length > maxLength 
    ? finalTitle.substring(0, maxLength) 
    : finalTitle
  
  return `${dateStr}_${truncatedTitle}.${extension}`
}

/**
 * Генерирует имя файла для Markdown
 */
export function generateMarkdownFileName(title: string, date?: Date): string {
  return generateFileName(title, 'md', date)
}

/**
 * Генерирует имя файла для PDF
 */
export function generatePDFFileName(title: string, date?: Date): string {
  return generateFileName(title, 'pdf', date)
}
