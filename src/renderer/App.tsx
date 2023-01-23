import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Index from './pages/Index';
import MovieDetails from './pages/MovieDetails';
import SearchResults from './pages/SearchResults';
import Settings from './pages/Settings';

import './styles/globals.css';

const App = () => {
  return (
    <div className="container mx-auto px-4">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search/:query" element={<SearchResults />} />
          <Route path="/details/:id" element={<MovieDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
