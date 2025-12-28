import React from 'react';

/**
 * IncidentsTable - Shows a list of conversation incidents for a user
 * Each incident can be clicked to view the full audit detail
 */
export default function IncidentsTable({ userName, conversationHistory, onIncidentClick, onClose }) {
  // For this demo, we treat the entire conversation as one incident
  // In a real app, you might have multiple conversations or flagged exchanges
  const incidents = conversationHistory && conversationHistory.length > 0
    ? [{
        id: 'incident-001',
        date: new Date().toISOString().split('T')[0],
        conversationId: 'conv-001',
        messages: conversationHistory,
        violationCount: countViolations(conversationHistory),
        severity: 'High',
        status: hasViolations(conversationHistory) ? 'Flagged' : 'Clean'
      }]
    : [];

  function countViolations(messages) {
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
  }

  function hasViolations(messages) {
    return countViolations(messages) > 0;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              Conversation Incidents
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              User: {userName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        </div>

        {/* Table Content */}
        <div style={{ padding: '24px' }}>
          {incidents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#6b7280'
            }}>
              <p>No conversation history available for this user.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Incident ID
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Messages
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Violations
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Severity
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px',
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
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {incident.id}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {incident.date}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {incident.messages.length}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: incident.violationCount > 0 ? '#fee2e2' : '#e8f5e9',
                        color: incident.violationCount > 0 ? '#991b1b' : '#1b5e20'
                      }}>
                        {incident.violationCount}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: incident.severity === 'High' ? '#fef3c7' : '#e5e7eb',
                        color: incident.severity === 'High' ? '#92400e' : '#374151'
                      }}>
                        {incident.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: incident.status === 'Flagged' ? '#fee2e2' : '#e8f5e9',
                        color: incident.status === 'Flagged' ? '#991b1b' : '#1b5e20'
                      }}>
                        {incident.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => onIncidentClick(incident)}
                        style={{
                          padding: '6px 12px',
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
          )}
        </div>
      </div>
    </div>
  );
}
