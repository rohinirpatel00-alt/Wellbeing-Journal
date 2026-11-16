import { useState } from 'react';
import EntryForm from './components/EntryForm.jsx';
import History from './components/History.jsx';
import Trends from './components/Trends.jsx';
import Patterns from './components/Patterns.jsx';
import { localToday } from './lib/dates.js';

const TABS = [
  { id: 'log', label: 'Log', icon: '✏️' },
  { id: 'history', label: 'History', icon: '📖' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'patterns', label: 'Patterns', icon: '🔍' },
];

export default function App() {
  const [tab, setTab] = useState('log');
  const [logDate, setLogDate] = useState(localToday());
  // Bumped after any save/delete so other tabs refetch fresh data.
  const [version, setVersion] = useState(0);
  const changed = () => setVersion((v) => v + 1);

  const editDate = (date) => {
    setLogDate(date);
    setTab('log');
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>🌿 Wellbeing Journal</h1>
          <p className="tagline">A private place to notice how your sleep, mood and routines move over time.</p>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true" className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'log' && <EntryForm date={logDate} onDateChange={setLogDate} onChanged={changed} />}
        {tab === 'history' && <History version={version} onEdit={editDate} onChanged={changed} />}
        {tab === 'trends' && <Trends version={version} />}
        {tab === 'patterns' && <Patterns version={version} />}
      </main>

      <footer className="footer">
        <p>
          This journal is for personal reflection only. It does not diagnose, treat or give medical advice. If you are
          worried about your health, please talk to a qualified professional.
        </p>
      </footer>
    </div>
  );
}
