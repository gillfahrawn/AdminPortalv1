import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { getAllUsers } from '../services/api';

/**
 * WizardManager - Intelligent tour system for demo mode
 *
 * Environment Detection:
 * - Checks VITE_DEMO_MODE environment variable
 * - Checks localStorage for 'tour_complete' flag
 * - Auto-redirects to incident detail page if conditions met
 *
 * Tour Flow:
 * - 10 steps across 3 pages (Incident Detail → Incidents → Data Table)
 * - Forced interactions on critical buttons
 * - Page navigation with state persistence
 */

const TOUR_STORAGE_KEY = 'tour_complete';

function isTruthyEnvValue(v) {
  return String(v || '').toLowerCase() === 'true';
}

export default function WizardManager({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourKey, setTourKey] = useState(0); // Force re-render when needed
  const [demoLandingPath, setDemoLandingPath] = useState(null);
  const [landingResolved, setLandingResolved] = useState(false);

  // Check if demo mode is active
  // NOTE: This is a Vite app, so use VITE_* vars. We also support a "NEXT_PUBLIC_DEMO_MODE"
  // naming convention via VITE_NEXT_PUBLIC_DEMO_MODE to match common Next.js wording.
  const isDemoMode =
    isTruthyEnvValue(import.meta.env.VITE_DEMO_MODE) ||
    isTruthyEnvValue(import.meta.env.VITE_NEXT_PUBLIC_DEMO_MODE);
  const isTourComplete = localStorage.getItem(TOUR_STORAGE_KEY) !== null;

  // Debug logging (remove in production if desired)
  useEffect(() => {
    console.log('🎯 WizardManager Debug:', {
      'VITE_DEMO_MODE': import.meta.env.VITE_DEMO_MODE,
      'VITE_NEXT_PUBLIC_DEMO_MODE': import.meta.env.VITE_NEXT_PUBLIC_DEMO_MODE,
      'isDemoMode': isDemoMode,
      'isTourComplete': isTourComplete,
      'willRunTour': isDemoMode && !isTourComplete
    });
  }, [isDemoMode, isTourComplete]);

  // Resolve demo landing destination (pick a real userId from the API)
  useEffect(() => {
    let cancelled = false;

    async function resolveLanding() {
      // If demo mode isn't enabled, don't block app render.
      if (!isDemoMode || isTourComplete) {
        if (!cancelled) {
          setDemoLandingPath(null);
          setLandingResolved(true);
        }
        return;
      }

      try {
        const resp = await getAllUsers();
        const users = resp?.data?.users || [];

        // Prefer a user who actually has conversation history so the incident detail page loads.
        const preferred =
          users.find((u) => Array.isArray(u.conversationHistory) && u.conversationHistory.length > 0) ||
          users[0];

        if (!preferred?.id) {
          throw new Error('No users returned from API (missing id)');
        }

        const path = `/audit/${preferred.id}/incident/incident-001`;
        if (!cancelled) {
          setDemoLandingPath(path);
          setLandingResolved(true);
        }
      } catch (e) {
        // If the API is down/unreachable, do NOT force redirect (avoid blank error screens).
        console.warn('[WizardManager] Failed to resolve demo landing path. Skipping auto-redirect.', e);
        if (!cancelled) {
          setDemoLandingPath(null);
          setLandingResolved(true);
        }
      }
    }

    resolveLanding();
    return () => {
      cancelled = true;
    };
  }, [isDemoMode, isTourComplete]);

  // Initialize tour on mount
  useEffect(() => {
    if (!landingResolved) return;

    if (isDemoMode && !isTourComplete) {
      // Redirect to demo incident page if not already there
      if (
        demoLandingPath &&
        (location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/success')
      ) {
        navigate(demoLandingPath, { replace: true });
      }

      // Start tour after navigation
      setTimeout(() => setRunTour(true), 500);
    }
  }, [isDemoMode, isTourComplete, landingResolved, demoLandingPath]);

  // Handle tour state changes
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type, lifecycle } = data;

    // Tour finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      return;
    }

    // Handle step transitions
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      // After clicking Schema tab, re-target the JSON textarea (DOM changes)
      if (index === 6 && action === ACTIONS.NEXT) {
        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setTourKey(prev => prev + 1);
        }, 300);
        return;
      }

      // Navigate back to incidents page (Back button step)
      if (index === 10 && action === ACTIONS.NEXT) {
        const currentPath = location.pathname;
        const userId = currentPath.split('/')[2]; // Extract userId from /audit/:userId/incident/:incidentId
        navigate(`/audit/${userId}`);

        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setTourKey(prev => prev + 1);
        }, 500);
        return;
      }

      // Navigate back to data table (Back to Data Table step)
      if (index === 11 && action === ACTIONS.NEXT) {
        navigate('/data');

        setTimeout(() => {
          setStepIndex(nextStepIndex);
          setTourKey(prev => prev + 1);
        }, 500);
        return;
      }

      setStepIndex(nextStepIndex);
    }
  };

  // Tour steps configuration
  const steps = [
    // STEP 1: Conversation Tab
    {
      target: '[data-tour="conversation-tab"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Welcome to the AI Auditor Platform</h3>
          <p className="mb-2">
            This is the <strong>Conversation Tab</strong> where you see the live customer-chatbot exchange.
          </p>
          <p className="text-sm text-gray-700">
            Our AI Auditor analyzes each bot response in real-time, comparing it against your policy schema to detect violations before they reach customers.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'bottom',
    },

    // STEP 2: Approve & Send Modified Button (FORCED)
    {
      target: '[data-tour="approve-button"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Policy-Aligned Responses</h3>
          <p className="mb-2">
            When the auditor detects a policy violation, it automatically generates a <strong>compliant alternative</strong> response.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            Click <strong>"Approve & Send modified"</strong> to replace risky AI output with policy-aligned content. This ensures customers receive accurate information while maintaining conversational quality.
          </p>
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ Click the button to continue the tour
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'top',
      spotlightClicks: true, // Allow clicking the button
      hideCloseButton: true,
      hideFooter: false,
      disableOverlayClose: true,
    },

    // STEP 3: Stop & Send Human Button
    {
      target: '[data-tour="stop-button"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Human Escalation</h3>
          <p className="mb-2">
            For high-risk situations requiring judgment calls, <strong>"Stop & Request human"</strong> immediately halts the bot and routes to your support team.
          </p>
          <p className="text-sm text-gray-700">
            This prevents automated systems from making promises they can't keep or handling sensitive exceptions beyond policy boundaries.
          </p>
        </div>
      ),
      placement: 'top',
    },

    // STEP 4: Override & Send Original Button
    {
      target: '[data-tour="override-button"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Human Oversight & Flexibility</h3>
          <p className="mb-2">
            The system balances automation with human judgment. Use <strong>"Override"</strong> when you determine the auditor's concern is a false positive.
          </p>
          <p className="text-sm text-gray-700">
            This ensures compliance teams maintain final authority while the AI handles routine policy enforcement at scale.
          </p>
        </div>
      ),
      placement: 'top',
    },

    // STEP 5: Decision Card (Right Panel)
    {
      target: '[data-tour="decision-card"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Full Auditability</h3>
          <p className="mb-2">
            Every interjection is fully transparent. The <strong>Decision Card</strong> shows the auditor's confidence level and detailed rationale.
          </p>
          <p className="text-sm text-gray-700">
            This provides the <em>"Why"</em> behind every decision—critical for compliance documentation, quality assurance, and regulatory audits.
          </p>
        </div>
      ),
      placement: 'left',
    },

    // STEP 6: Schema Summary Card
    {
      target: '[data-tour="schema-summary"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Policy Configuration</h3>
          <p className="mb-2">
            The <strong>Schema Summary</strong> shows your organization's support protocols at a glance—refund windows, escalation triggers, and compliance requirements.
          </p>
          <p className="text-sm text-gray-700">
            Your schema drives the entire auditor engine. Next, we'll explore the technical details.
          </p>
        </div>
      ),
      placement: 'left',
    },

    // STEP 7: Schema Tab (FORCED)
    {
      target: '[data-tour="schema-tab"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Schema Editor Access</h3>
          <p className="mb-2">
            Click the <strong>Schema tab</strong> to view and edit your policy rules in JSON format.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            This provides technical transparency for developers, compliance officers, and security teams who need to verify exact rule logic.
          </p>
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ Click the Schema tab to continue
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: true,
      hideCloseButton: true,
      disableOverlayClose: true,
    },

    // STEP 8: JSON Schema Textarea
    {
      target: '[data-tour="schema-json"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Declarative Policy Engine</h3>
          <p className="mb-2">
            Your policy schema is <strong>fully programmable</strong>. Each rule specifies matching patterns, severity levels, and enforcement actions.
          </p>
          <p className="text-sm text-gray-700">
            Edit rules here, return to the Conversation tab, and the auditor instantly re-evaluates with your updated schema. Perfect for iterating on compliance requirements without code deployments.
          </p>
        </div>
      ),
      placement: 'right',
    },

    // STEP 9: Audit Log Tab (Reviewable evidence)
    {
      target: '[data-tour="auditlog-tab"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Audit Log</h3>
          <p className="mb-2">
            Switch to the <strong>Audit Log</strong> to review how the auditor reached its decision and what changed.
          </p>
          <p className="text-sm text-gray-700 mb-2">
            This is the evidence trail compliance teams rely on for internal reviews and regulatory audits.
          </p>
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ Click the Audit Log tab to continue
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: true,
      hideCloseButton: true,
      disableOverlayClose: true,
    },

    // STEP 10: Audit Log Panel
    {
      target: '[data-tour="auditlog-panel"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Decision Traceability</h3>
          <p className="mb-2">
            Every interjection is recorded with context—what rule fired, why it mattered, and how the response was modified.
          </p>
          <p className="text-sm text-gray-700">
            This supports accountability and reduces time-to-resolution when reviewing flagged conversations.
          </p>
        </div>
      ),
      placement: 'left',
    },

    // STEP 11: Back to Incidents (Navigation)
    {
      target: '[data-tour="back-button"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Incident Navigation</h3>
          <p className="mb-2">
            Let's explore the broader incident management system. Click the <strong>Back button</strong> to return to the customer incidents table.
          </p>
          <p className="text-sm text-gray-700">
            This is where compliance teams review all flagged conversations for a specific customer.
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: true,
      hideCloseButton: true,
      disableOverlayClose: true,
    },

    // STEP 12: Back to Data Table (Navigation)
    {
      target: '[data-tour="back-button-incidents"]',
      content: (
        <div>
          <h3 className="font-semibold text-lg mb-2">Full Customer Overview</h3>
          <p className="mb-2">
            Click <strong>Back</strong> one more time to see the complete customer database with audit status badges.
          </p>
          <p className="text-sm text-gray-700 mb-3">
            From here, compliance officers can quickly identify which customers have flagged conversations requiring review.
          </p>
          <p className="text-xs text-green-700 font-medium">
            ✓ This completes the tour. Thank you for exploring the AI Auditor platform!
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: true,
      hideCloseButton: true,
      disableOverlayClose: true,
    },
  ];

  // Don't render tour if not in demo mode or already completed
  if (!isDemoMode || isTourComplete) {
    return <>{children}</>;
  }

  return (
    <>
      <Joyride
        key={tourKey}
        steps={steps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#111827',
            zIndex: 10000,
          },
          tooltip: {
            fontSize: 14,
            borderRadius: 12,
          },
          buttonNext: {
            backgroundColor: '#111827',
            borderRadius: 8,
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: 8,
          },
          buttonSkip: {
            color: '#ef4444',
            fontSize: 13,
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      {children}
    </>
  );
}

/**
 * Utility: Reset tour for development
 * Call this from browser console: window.resetTour()
 */
if (typeof window !== 'undefined') {
  window.resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };
}
