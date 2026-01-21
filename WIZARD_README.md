# React Joyride Wizard - AI Auditor Product Tour

## Overview

The WizardManager component provides an intelligent, environment-aware product tour for public visitors while staying completely out of the way during development. It uses React Joyride to create a professional, MBA-appropriate guided experience through the AI Auditor platform.

## Features

✅ **Smart Environment Detection** - Uses environment variables + localStorage to determine when to show the tour
✅ **Auto-redirect on First Visit** - Automatically routes visitors from login to the demo incident page
✅ **Controlled Navigation** - Guides users across 3 pages with forced interactions on critical features
✅ **Developer Escape Hatch** - One-click skip or completion sets a flag to prevent tour loops
✅ **Professional Copy** - Business-appropriate content highlighting technical transparency and compliance
✅ **Persistent State** - LocalStorage prevents tour from reappearing after completion or skip

## Quick Start

### Enable Demo Mode

1. **Development Testing:**
   ```bash
   cd frontend
   # Edit .env.local
   VITE_DEMO_MODE=true
   npm run dev
   ```

2. **Production Deployment:**
   ```bash
   # Set environment variable in your hosting platform
   VITE_DEMO_MODE=true
   ```

3. **Reset Tour (Development):**
   ```javascript
   // In browser console
   window.resetTour()
   // Or manually:
   localStorage.removeItem('tour_complete')
   ```

## Architecture

### Environment Logic

```javascript
// Demo mode is active when:
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const isTourComplete = localStorage.getItem('tour_complete') !== null;

// Tour runs when:
if (isDemoMode && !isTourComplete) {
  // Redirect to demo incident page
  // Start tour automatically
}
```

### Tour Flow (10 Steps Across 3 Pages)

#### Page 1: Incident Detail (`/audit/:userId/incident/:incidentId`)

**Step 1: Conversation Tab**
Highlights the conversation tab and explains the real-time comparison logic.

**Step 2: "Approve & Send Modified" Button (FORCED CLICK)**
User must click this button to advance. Explains replacing risky AI output with policy-aligned content.

**Step 3: "Stop & Request Human" Button**
Explains human escalation for high-risk situations.

**Step 4: "Override & Send Original" Button**
Explains the balance between automation and human oversight.

**Step 5: Decision Card (Right Panel)**
Highlights the decision rationale card, emphasizing full auditability.

**Step 6: Schema Summary Card**
Shows policy configuration at a glance.

**Step 7: Schema Tab (FORCED CLICK)**
User must click the Schema tab to continue. Explains technical transparency.

**Step 8: JSON Schema Textarea**
Highlights the editable JSON schema, explaining declarative policy configuration.

#### Page 2: Customer Incidents (`/audit/:userId`)

**Step 9: Back Button (FORCED CLICK)**
Guides user to click "Back to Data Table" button. Tour persists across navigation.

#### Page 3: Data Table (`/data`)

**Step 10: Back Button (FORCED CLICK)**
Final step guides user back to full customer overview. Tour completes after this click.

## Component Structure

### WizardManager Component

Location: `frontend/src/components/WizardManager.jsx`

```jsx
<WizardManager>
  <Routes>
    {/* Your routes */}
  </Routes>
</WizardManager>
```

**Key Props & Configuration:**
- `runTour` - Boolean state controlling tour visibility
- `stepIndex` - Current step in the tour
- `tourKey` - Force re-render when navigating between pages
- `handleJoyrideCallback` - Manages step transitions and navigation

### Data Attributes

All tour targets use `data-tour` attributes:

```jsx
// Conversation tab
<button data-tour="conversation-tab">Conversation</button>

// Action buttons
<button data-tour="approve-button">Approve & Send modified</button>
<button data-tour="stop-button">Stop & Request human</button>
<button data-tour="override-button">Override & Send original</button>

// Right sidebar
<Card data-tour="decision-card">...</Card>
<Card data-tour="schema-summary">...</Card>

// Schema tab and textarea
<button data-tour="schema-tab">Schema</button>
<textarea data-tour="schema-json">...</textarea>

// Back buttons
<button data-tour="back-button">← Back</button> // Incident detail page
<button data-tour="back-button-incidents">← Back to Data Table</button> // Incidents page
```

## Customization

### Modify Tour Steps

Edit `frontend/src/components/WizardManager.jsx`:

```javascript
const steps = [
  {
    target: '[data-tour="conversation-tab"]',
    content: (
      <div>
        <h3>Your Custom Title</h3>
        <p>Your custom explanation...</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  // Add more steps...
];
```

### Change Demo Incident URL

```javascript
// In WizardManager.jsx
const DEMO_INCIDENT_URL = '/audit/your-user-id/incident/your-incident-id';
```

### Customize Styling

```javascript
// In WizardManager.jsx - Joyride styles prop
styles={{
  options: {
    primaryColor: '#111827', // Change primary color
    zIndex: 10000,
  },
  tooltip: {
    fontSize: 14,
    borderRadius: 12, // Change tooltip border radius
  },
  // Customize other elements...
}}
```

### Change Button Labels

```javascript
// In WizardManager.jsx - Joyride locale prop
locale={{
  back: 'Previous',
  close: 'Exit Tour',
  last: 'Complete Tour',
  next: 'Continue',
  skip: 'Skip Tour',
}}
```

## Developer Tools

### Reset Tour Function

A global `window.resetTour()` function is available in the browser console:

```javascript
// Automatically added by WizardManager
window.resetTour = () => {
  localStorage.removeItem('tour_complete');
  window.location.reload();
};
```

### Check Tour Status

```javascript
// In browser console
localStorage.getItem('tour_complete') // null = not completed, 'true' = completed
```

### Force Tour Start

```javascript
// In browser console
localStorage.removeItem('tour_complete');
window.location.href = '/audit/1/incident/incident-001';
```

## Behavior Details

### Forced Clicks (spotlightClicks)

Steps 2, 7, 9, and 10 require user interaction:

```javascript
{
  target: '[data-tour="approve-button"]',
  spotlightClicks: true,         // Allow clicking the highlighted element
  hideCloseButton: true,         // Hide X button to force interaction
  disableOverlayClose: true,     // Disable clicking outside to close
  // User MUST click the button to advance
}
```

### Navigation Persistence

The tour persists across page changes using React Router navigation:

```javascript
// Example: Step 9 -> Navigate to incidents page
if (index === 8 && action === ACTIONS.NEXT) {
  navigate(`/audit/${userId}`);
  setTimeout(() => {
    setStepIndex(nextStepIndex);
    setTourKey(prev => prev + 1); // Force re-render
  }, 500);
}
```

### Tour Completion

The tour ends when:
1. User clicks "Finish" on the last step
2. User clicks "Skip Tour" on any step
3. User closes the tour modal (if closeButton is visible)

All of these set the localStorage flag:
```javascript
localStorage.setItem('tour_complete', 'true');
```

## Testing Checklist

- [ ] Tour starts automatically when `VITE_DEMO_MODE=true` and `tour_complete` is not set
- [ ] Auto-redirect from `/` to `/audit/1/incident/incident-001` works
- [ ] Step 1: Conversation tab is highlighted correctly
- [ ] Step 2: "Approve" button requires click to advance
- [ ] Steps 3-6: All highlights appear in correct positions
- [ ] Step 7: Schema tab requires click to advance
- [ ] Step 8: JSON textarea is highlighted after clicking Schema tab
- [ ] Step 9: Back button requires click, navigates to incidents page
- [ ] Step 10: Back button requires click, navigates to data table
- [ ] "Skip Tour" button sets `tour_complete` flag
- [ ] "Finish" button on last step sets `tour_complete` flag
- [ ] Tour does not restart after completion
- [ ] `window.resetTour()` clears flag and reloads page
- [ ] Tour does not run when `VITE_DEMO_MODE=false`

## Deployment

### Vercel / Netlify

Add environment variable in dashboard:
```
VITE_DEMO_MODE=true
```

### Docker

```dockerfile
ENV VITE_DEMO_MODE=true
```

### GitHub Actions

```yaml
env:
  VITE_DEMO_MODE: true
```

### Build Time

Vite embeds environment variables at build time, so you must rebuild after changing:

```bash
npm run build
```

## Troubleshooting

### Tour Not Starting

1. Check environment variable:
   ```javascript
   console.log(import.meta.env.VITE_DEMO_MODE)
   ```

2. Check localStorage flag:
   ```javascript
   console.log(localStorage.getItem('tour_complete'))
   ```

3. Clear flag and reload:
   ```javascript
   window.resetTour()
   ```

### Tour Steps Not Found

If you see "target not found" warnings:
1. Verify `data-tour` attributes are present on target elements
2. Check that element is rendered (not hidden by conditional logic)
3. Ensure element is visible in DOM when step is shown

### Navigation Issues

If tour doesn't persist across page changes:
1. Verify WizardManager is inside `<Router>` but outside `<Routes>`
2. Check `tourKey` is incrementing in navigation handlers
3. Add longer delay in `setTimeout` if page renders slowly

## License

This implementation is part of the AI Auditor Admin Portal.

---

**Questions?** Check the inline comments in `frontend/src/components/WizardManager.jsx` for detailed implementation notes.
