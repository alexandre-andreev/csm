export default function TestDesignPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <h1 style={{
        fontSize: '3rem',
        color: 'white',
        textAlign: 'center',
        margin: 0
      }}>
        Тест дизайна
      </h1>
      
      <div style={{
        width: '200px',
        height: '200px',
        background: 'linear-gradient(45deg, #ff9a9e, #fecfef)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <span style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          CSS работает!
        </span>
      </div>
      
      <p style={{
        color: 'white',
        fontSize: '1.2rem',
        textAlign: 'center',
        margin: 0
      }}>
        Если вы видите градиенты и стили, значит CSS работает правильно
      </p>
    </div>
  )
}
