import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../services/api';

/**
 * AuditIncidentsPage - Level 2 page showing incidents for a specific user
 * Route: /audit/:userId
 */
export default function AuditIncidentsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const response = await getUser(userId);
      setUser(response.data.user);
      setError('');
    } catch (err) {
      setError('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const countViolations = (messages) => {
    if (!messages || messages.length === 0) return 0;

    const violationPatterns = [
      { userIncludes: ['refund', 'return'], daysSinceOver: 30 },
      { botIncludes: ['processed a full refund', "absolutely! i've processed"] },
      { botIncludes: ['full card number', 'security number', 'password'] },
    ];

    let count = 0;
    const userText = messages.filter(m => m.role === 'user').map(m => m.text).join(' ').toLowerCase();
    const botText = messages.filter(m => m.role === 'bot').map(m => m.text).join(' ').toLowerCase();

    for (const pattern of violationPatterns) {
      if (pattern.userIncludes && pattern.userIncludes.some(kw => userText.includes(kw.toLowerCase()))) {
        if (pattern.daysSinceOver) {
          const dayMatch = userText.match(/(\d{1,3})\s*day/i);
          if (dayMatch && parseInt(dayMatch[1]) > pattern.daysSinceOver) {
            count++;
          }
        }
      }
      if (pattern.botIncludes && pattern.botIncludes.some(kw => botText.includes(kw.toLowerCase()))) {
        count++;
      }
    }

    return count;
  };

  const hasViolations = (messages) => {
    return countViolations(messages) > 0;
  };

  const handleIncidentClick = (incident) => {
    navigate(`/audit/${userId}/incident/${incident.id}`);
  };

  const handleBack = () => {
    navigate('/data');
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

  if (error || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', color: '#c62828', marginBottom: '20px' }}>
          {error || 'User not found'}
        </div>
        <button
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Back to Data Table
        </button>
      </div>
    );
  }

  // Create incidents from conversation history
  const incidents = user.conversationHistory && user.conversationHistory.length > 0
    ? [{
        id: 'incident-001',
        date: new Date().toISOString().split('T')[0],
        conversationId: 'conv-001',
        messages: user.conversationHistory,
        violationCount: countViolations(user.conversationHistory),
        severity: 'High',
        status: hasViolations(user.conversationHistory) ? 'Flagged' : 'Clean'
      }]
    : [];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '8px', fontSize: '28px', fontWeight: 'bold' }}>
              Conversation Incidents
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
              User: <span style={{ fontWeight: '600', color: '#111827' }}>{user.email}</span>
            </p>
          </div>
          <button
            data-tour="back-button-incidents"
            onClick={handleBack}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Data Table
          </button>
        </div>

        {/* Content */}
        {incidents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
              No conversation history available
            </p>
            <p style={{ fontSize: '14px' }}>
              This user hasn't had any conversations yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Incident ID
                  </th>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Messages
                  </th>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Violations
                  </th>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Severity
                  </th>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '14px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: '500' }}>
                      {incident.id}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>
                      {incident.date}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                      {incident.messages.length}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: incident.violationCount > 0 ? '#fee2e2' : '#e8f5e9',
                        color: incident.violationCount > 0 ? '#991b1b' : '#1b5e20'
                      }}>
                        {incident.violationCount}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: incident.severity === 'High' ? '#fef3c7' : '#e5e7eb',
                        color: incident.severity === 'High' ? '#92400e' : '#374151'
                      }}>
                        {incident.severity}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: incident.status === 'Flagged' ? '#fee2e2' : '#e8f5e9',
                        color: incident.status === 'Flagged' ? '#991b1b' : '#1b5e20'
                      }}>
                        {incident.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <button
                        onClick={() => handleIncidentClick(incident)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          backgroundColor: '#111827',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
