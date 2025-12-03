import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminConfig, updateAdminConfig } from '../services/api';

const Admin = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ page2: [], page3: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const componentLabels = {
    about_me: 'About Me',
    address: 'Address',
    birthdate: 'Date of Birth'
  };

  const allComponents = ['about_me', 'address', 'birthdate'];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getAdminConfig();
      setConfig(response.data.config);
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveComponent = (component, toPage) => {
    setError('');
    setSuccess('');

    const fromPage = config.page2.includes(component) ? 'page2' : 'page3';

    if (fromPage === toPage) return;

    // Create new config
    const newConfig = { ...config };
    newConfig[fromPage] = newConfig[fromPage].filter(c => c !== component);
    newConfig[toPage] = [...newConfig[toPage], component];

    // Validate: each page must have at least one component
    if (newConfig.page2.length === 0 || newConfig.page3.length === 0) {
      setError('Each page must have at least one component');
      return;
    }

    setConfig(newConfig);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate before saving
      if (config.page2.length === 0 || config.page3.length === 0) {
        setError('Each page must have at least one component');
        return;
      }

      await updateAdminConfig(config);
      setSuccess('Configuration saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderComponentCard = (component, currentPage) => {
    const otherPage = currentPage === 'page2' ? 'page3' : 'page2';
    const pageNumber = currentPage === 'page2' ? 2 : 3;
    const otherPageNumber = otherPage === 'page2' ? 2 : 3;

    return (
      <div
        key={component}
        style={{
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontWeight: '500' }}>{componentLabels[component]}</span>
        <button
          onClick={() => handleMoveComponent(component, otherPage)}
          disabled={config[currentPage].length === 1}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: config[currentPage].length === 1 ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: config[currentPage].length === 1 ? 'not-allowed' : 'pointer'
          }}
          title={config[currentPage].length === 1 ? 'Page must have at least one component' : ''}
        >
          Move to Page {otherPageNumber}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ margin: 0 }}>Admin Configuration</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/data')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              View Data
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>

        <p style={{ marginBottom: '30px', color: '#666' }}>
          Configure which form components appear on each page of the onboarding flow.
          Each page must have at least one component.
        </p>

        {error && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            borderRadius: '4px'
          }}>
            {success}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '30px'
        }}>
          <div>
            <h2 style={{ marginBottom: '15px' }}>Page 2</h2>
            <div>
              {config.page2.map(component => renderComponentCard(component, 'page2'))}
            </div>
          </div>

          <div>
            <h2 style={{ marginBottom: '15px' }}>Page 3</h2>
            <div>
              {config.page3.map(component => renderComponentCard(component, 'page3'))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#1565c0'
        }}>
          <strong>Note:</strong> Changes will take effect immediately for new users and users
          who haven't completed their onboarding yet.
        </div>
      </div>
    </div>
  );
};

export default Admin;
