import React, { useEffect, useState } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import styled from 'styled-components';
import AppRouter from './routes/routes'
import { Sidebar } from './components/Sidebar'
import { BranchSelector } from './components/BranchSelector'
import { Light, Dark } from "./styles/Themes";
import { ThemeProvider } from "styled-components";
import { BranchProvider } from './context/BranchContext'
import Inventory from "./pages/Inventory";
import { AuthProvider } from './context/AuthContext';
export const ThemeContext = React.createContext(null);

function AppContent() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <AppWrapper>
      {!isLoginPage && (
        <BranchSelector
          mostrarBotonMenu={isMobile && !sidebarOpen}
          onOpenMenu={() => setSidebarOpen(true)}
        />
      )}
      {!isLoginPage && isMobile && sidebarOpen && <Backdrop onClick={() => setSidebarOpen(false)} />}
      <Container className={!isLoginPage && sidebarOpen && !isMobile ? "sidebarState active" : ""} isLoginPage={isLoginPage} isMobile={isMobile}>
        {!isLoginPage && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isMobile={isMobile}
          />
        )}
        <Content isLoginPage={isLoginPage}>
            <AppRouter />
        </Content>
      </Container>
    </AppWrapper>
  );
}

function App() {
  const [theme, setTheme] = useState("light")
  const themeStyle = theme === "light" ? Light : Dark;

  return (
    <>
      <ThemeContext.Provider value={{ setTheme, theme }}>
        <ThemeProvider theme={themeStyle}>
          <AuthProvider>
            <BranchProvider>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </BranchProvider>
          </AuthProvider>
        </ThemeProvider>
      </ThemeContext.Provider>
    </>
  )
}
const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

const Container = styled.div`
  display: grid;
  flex: 1;
  grid-template-columns: ${({ isLoginPage }) => isLoginPage ? '1fr' : '90px auto'};
  background: ${({ theme }) => theme.bgtotal};
  transition: all 0.3s;
  &.active {
    grid-template-columns: 300px auto;
  }
  color: ${({ theme }) => theme.text};
  overflow: hidden;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;

    &.active {
      grid-template-columns: 1fr;
    }
  }
`;


const Content = styled.div`
  grid-column: ${({ isLoginPage }) => isLoginPage ? '1' : '2'};       
  height: 100%;     
  overflow-y: auto;    
  padding-left: ${({ isLoginPage }) => isLoginPage ? '0' : '1rem'};     
  padding-right: ${({ isLoginPage }) => isLoginPage ? '0' : '1rem'};

  @media (max-width: 768px) {
    grid-column: 1;
    padding-left: 0;
    padding-right: 0;
  }
`;


const Backdrop = styled.button`
  position: fixed;
  inset: 0;
  z-index: 900;
  border: 0;
  padding: 0;
  background: rgba(0, 0, 0, 0.35);

  @media (min-width: 769px) {
    display: none;
  }
`;


export default App
