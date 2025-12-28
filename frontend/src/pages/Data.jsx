import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../services/api';
import IncidentsTable from '../components/IncidentsTable';
import IncidentDetailPage from '../components/IncidentDetailPage';

// Simple audit logic to detect violations (matching the modal's logic)
function hasViolations(conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) return false;

  const user = conversationHistory.findLast((m) => m.role === 'user');
  const bot = conversationHistory.findLast((m) => m.role === 'bot');

  if (!user || !bot) return false;

  const userText = user.text.toLowerCase();
  const botText = bot.text.toLowerCase();

  // Check for violation patterns
  const violationPatterns = [
    // Refund past window
    { userIncludes: ['refund', 'return'], daysSinceOver: 30 },
    // Promising outside policy
    { botIncludes: ['processed a full refund', "absolutely! i've processed"] },
    // Sensitive data
    { botIncludes: ['full card number', 'security number', 'password'] },
  ];

  for (const pattern of violationPatterns) {
    if (pattern.userIncludes && pattern.userIncludes.some(kw => userText.includes(kw))) {
      // Check if days mentioned
      const daysMatch = user.text.match(/(\d{1,3})\s*day/gi);
      if (daysMatch) {
        const days = parseInt(daysMatch[0].match(/\d{1,3}/)[0], 10);
        if (days > 30) return true;
      }
    }

    if (pattern.botIncludes && pattern.botIncludes.some(kw => botText.includes(kw))) {
      return true;
    }
  }

  return false;
}

const Data = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [view, setView] = useState(null); // null | 'incidents' | 'detail'

  useEffect(() => {
    loadUsers();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data.users);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatBoolean = (value) => {
    return value ? 'Yes' : 'No';
  };

  const handleReviewAudit = (user) => {
    setSelectedUser(user);
    setView('incidents');
  };

  const handleIncidentClick = (incident) => {
    setSelectedIncident(incident);
    setView('detail');
  };

  const closeIncidentsTable = () => {
    setSelectedUser(null);
    setSelectedIncident(null);
    setView(null);
  };

  const closeIncidentDetail = () => {
    setSelectedIncident(null);
    setView('incidents');
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
        maxWidth: '1600px',
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
          <div>
            <h1 style={{ margin: 0, marginBottom: '10px' }}>User Data</h1>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Auto-refreshes every 5 seconds
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/admin')}
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
              Admin Config
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

        {users.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No users yet</p>
            <p style={{ fontSize: '14px' }}>Complete the onboarding flow to see user data here</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>About Me</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>City</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>State</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Step</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Completed</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Audit Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const hasConversation = user.conversationHistory && user.conversationHistory.length > 0;
                  const hasFlags = hasViolations(user.conversationHistory);

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{user.id.substring(0, 8)}...</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{user.email}</td>
                      <td style={{ padding: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.about_me || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>{user.city || '-'}</td>
                      <td style={{ padding: '12px' }}>{user.state || '-'}</td>
                      <td style={{ padding: '12px' }}>{user.current_step || 1}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: user.completed ? '#e8f5e9' : '#fff3e0',
                          color: user.completed ? '#2e7d32' : '#e65100',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {formatBoolean(user.completed)}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {!hasConversation ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            No Chat
                          </span>
                        ) : hasFlags ? (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            🔴 Violations
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            ✅ Clean
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {hasConversation ? (
                          <button
                            onClick={() => handleReviewAudit(user)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              backgroundColor: hasFlags ? '#ff9800' : '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Review Audit
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#999' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#1565c0'
        }}>
          <strong>Total Users:</strong> {users.length}
          {users.filter(u => u.conversationHistory && u.conversationHistory.length > 0).length > 0 && (
            <>
              {' | '}
              <strong>With Conversations:</strong> {users.filter(u => u.conversationHistory && u.conversationHistory.length > 0).length}
              {' | '}
              <strong>Flagged:</strong> {users.filter(u => hasViolations(u.conversationHistory)).length}
            </>
          )}
        </div>
      </div>

      {/* Render Incidents Table or Detail View */}
      {view === 'incidents' && selectedUser && selectedUser.conversationHistory && (
        <IncidentsTable
          userName={selectedUser.email}
          conversationHistory={selectedUser.conversationHistory}
          onIncidentClick={handleIncidentClick}
          onClose={closeIncidentsTable}
        />
      )}

      {view === 'detail' && selectedIncident && (
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
          <IncidentDetailPage
            initialConversation={selectedIncident.messages}
            userName={selectedUser?.email || 'Unknown User'}
            onClose={closeIncidentDetail}
          />
        </div>
      )}
    </div>
  );
};

export default Data;
