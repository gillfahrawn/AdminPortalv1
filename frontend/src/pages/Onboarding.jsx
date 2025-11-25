import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authenticate, getUser, updateUserProgress, getAdminConfig } from '../services/api';
import ProgressIndicator from '../components/ProgressIndicator';
import AboutMeComponent from '../components/AboutMeComponent';
import AddressComponent from '../components/AddressComponent';
import BirthdateComponent from '../components/BirthdateComponent';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, login, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    about_me: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    birthdate: ''
  });

  // Load configuration and check for existing user
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await getAdminConfig();
        setConfig(response.data.config);
      } catch (err) {
        console.error('Failed to load config:', err);
        setError('Failed to load configuration');
      }
    };

    loadConfig();

    // If user is logged in, load their data and navigate to their current step
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        about_me: user.about_me || '',
        street_address: user.street_address || '',
        city: user.city || '',
        state: user.state || '',
        zip: user.zip || '',
        birthdate: user.birthdate || ''
      });

      // If user completed the flow, redirect to success
      if (user.completed) {
        navigate('/success');
      } else {
        // Navigate to their saved step
        setCurrentStep(user.current_step || 1);
      }
    }
  }, [user, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authenticate(formData.email, formData.password);
      login(response.data.user);
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (stepData, nextStep) => {
    if (!user) return;

    try {
      const updateData = {
        ...stepData,
        current_step: nextStep,
        completed: nextStep > 3
      };

      const response = await updateUserProgress(user.id, updateData);
      updateUser(response.data.user);
    } catch (err) {
      console.error('Failed to save progress:', err);
      throw err;
    }
  };

  const handleNext = async () => {
    setError('');
    setLoading(true);

    try {
      // Collect data for current step
      let stepData = {};

      if (currentStep === 2 && config) {
        config.page2.forEach(component => {
          if (component === 'about_me') {
            stepData.about_me = formData.about_me;
          } else if (component === 'address') {
            stepData.street_address = formData.street_address;
            stepData.city = formData.city;
            stepData.state = formData.state;
            stepData.zip = formData.zip;
          } else if (component === 'birthdate') {
            stepData.birthdate = formData.birthdate;
          }
        });
      } else if (currentStep === 3 && config) {
        config.page3.forEach(component => {
          if (component === 'about_me') {
            stepData.about_me = formData.about_me;
          } else if (component === 'address') {
            stepData.street_address = formData.street_address;
            stepData.city = formData.city;
            stepData.state = formData.state;
            stepData.zip = formData.zip;
          } else if (component === 'birthdate') {
            stepData.birthdate = formData.birthdate;
          }
        });
      }

      const nextStep = currentStep + 1;
      await saveProgress(stepData, nextStep);

      if (nextStep > 3) {
        navigate('/success');
      } else {
        setCurrentStep(nextStep);
      }
    } catch (err) {
      setError('Failed to save progress');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Create Account or Sign In</h2>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Email</strong>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          placeholder="your@email.com"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Password</strong>
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
          placeholder="Enter your password"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Processing...' : 'Continue'}
      </button>
    </form>
  );

  const renderDynamicStep = (pageComponents) => {
    if (!pageComponents) return null;

    return (
      <div>
        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>
          Tell Us More About Yourself
        </h2>

        {pageComponents.map((component, index) => (
          <div key={component} style={{ marginBottom: '30px' }}>
            {component === 'about_me' && (
              <AboutMeComponent
                value={formData.about_me}
                onChange={handleInputChange}
              />
            )}
            {component === 'address' && (
              <AddressComponent
                values={{
                  street_address: formData.street_address,
                  city: formData.city,
                  state: formData.state,
                  zip: formData.zip
                }}
                onChange={handleInputChange}
              />
            )}
            {component === 'birthdate' && (
              <BirthdateComponent
                value={formData.birthdate}
                onChange={handleInputChange}
              />
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button
            onClick={handleBack}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            style={{
              flex: 2,
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving...' : (currentStep === 3 ? 'Complete' : 'Next')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />

        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && config && renderDynamicStep(config.page2)}
        {currentStep === 3 && config && renderDynamicStep(config.page3)}
      </div>
    </div>
  );
};

export default Onboarding;
