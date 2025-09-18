interface ProgressBarProps {
  progress: number // 0-100
  text: string
  isVisible: boolean
}

export default function ProgressBar({ progress, text, isVisible }: ProgressBarProps) {
  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'spin 1s linear infinite'
          }}>
            <div style={{
              width: '0.75rem',
              height: '0.75rem',
              borderRadius: '50%',
              background: 'white'
            }} />
          </div>
          <span style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#111827'
          }}>
            Создание аннотации
          </span>
        </div>

        <div style={{
          marginBottom: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {text}
            </span>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              {Math.round(progress)}%
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '0.5rem',
            background: '#e5e7eb',
            borderRadius: '0.25rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #9333ea, #3b82f6)',
              borderRadius: '0.25rem',
              transition: 'width 0.3s ease-in-out',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          Пожалуйста, не закрывайте страницу...
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
