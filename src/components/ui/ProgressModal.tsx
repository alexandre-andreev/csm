'use client'

import { Loader, CheckCircle, AlertTriangle } from 'lucide-react'

interface ProgressModalProps {
  progress: number
  error: string | null
}

const steps = [
  'Извлечение ID видео',
  'Получение транскрипта',
  'Генерация аннотации',
  'Сохранение результата',
  'Готово!',
]

export default function ProgressModal({ progress, error }: ProgressModalProps) {
  if (progress === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {error ? 'Произошла ошибка' : 'Создание аннотации'}
        </h2>
        
        {error ? (
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center text-lg">
                {progress > index + 1 ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-4" />
                ) : progress === index + 1 ? (
                  <Loader className="h-6 w-6 text-purple-600 mr-4 animate-spin" />
                ) : (
                  <div className="h-6 w-6 mr-4" />
                )}
                <span className={
                  progress > index + 1 ? "text-gray-500 line-through" :
                  progress === index + 1 ? "text-purple-600 font-semibold" :
                  "text-gray-400"
                }>
                  {step}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
