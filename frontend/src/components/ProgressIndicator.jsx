const ProgressIndicator = ({ currentStep, totalSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '30px',
      padding: '20px 0'
    }}>
      {steps.map((step, index) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: step <= currentStep ? '#4CAF50' : '#ddd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'background-color 0.3s'
            }}
          >
            {step}
          </div>
          {index < steps.length - 1 && (
            <div
              style={{
                width: '80px',
                height: '4px',
                backgroundColor: step < currentStep ? '#4CAF50' : '#ddd',
                margin: '0 10px',
                transition: 'background-color 0.3s'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressIndicator;
