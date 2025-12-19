import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LiveTradingView from './pages/LiveTradingView';
import LeaderboardView from './pages/LeaderboardView';
import ArchiveView from './pages/ArchiveView';
import ChartsView from './pages/ChartsView';
import ComparisonView from './pages/ComparisonView';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LiveTradingView />} />
        <Route path="/charts" element={<ChartsView />} />
        <Route path="/leaderboard" element={<LeaderboardView />} />
        <Route path="/archive" element={<ArchiveView />} />
        <Route path="/comparison" element={<ComparisonView />} />
      </Routes>
    </Layout>
  );
}

export default App;
