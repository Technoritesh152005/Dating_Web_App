export function Bloom({ trigger, size = 240, className = '' }) {
    return (
      <div
        key={trigger}
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full bg-bloom animate-bloom ${className}`}
        style={{
          width: size,
          height: size,
          left: '50%',
          top: '50%',
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
      />
    );
  }
  
//   Whenever trigger changes, React creates a fresh <div>, and the CSS animation animate-bloom plays again.