import { useState } from 'react';
import DashboardPage from './pages/DashboardPage.jsx';
import NewCampaignPage from './pages/NewCampaignPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import ModeIndicator from './components/ModeIndicator.jsx';

export default function App() {
  const [view, setView] = useState({ screen: 'dashboard' });

  return (
    <>
      {view.screen === 'new' && (
        <NewCampaignPage onLaunched={(jobId) => setView({ screen: 'results', jobId })} />
      )}
      {view.screen === 'results' && (
        <ResultsPage jobId={view.jobId} onBack={() => setView({ screen: 'dashboard' })} />
      )}
      {view.screen === 'dashboard' && (
        <DashboardPage
          onNew={() => setView({ screen: 'new' })}
          onOpen={(jobId) => setView({ screen: 'results', jobId })}
        />
      )}
      <ModeIndicator />
    </>
  );
}

