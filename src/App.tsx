import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { ProjectsProvider } from './context/ProjectsContext';
import { ActiveSectionProvider } from './context/ActiveSectionContext';
import Home from './pages/Home';
import About from './pages/About';
import ProjectsPage from './pages/Projects';
import Amenities from './pages/Amenities';
import Contact from './pages/Contact';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('nav-open', sidebarOpen);
  }, [sidebarOpen]);

  return (
    <BrowserRouter>
      <ProjectsProvider>
        <ActiveSectionProvider>
          <ScrollToTop />
          <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="app-shell">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gioi-thieu" element={<About />} />
              <Route path="/du-an" element={<ProjectsPage />} />
              <Route path="/tien-ich" element={<Amenities />} />
              <Route path="/lien-he" element={<Contact />} />
            </Routes>
            <Footer />
          </div>
        </ActiveSectionProvider>
      </ProjectsProvider>
    </BrowserRouter>
  );
}

