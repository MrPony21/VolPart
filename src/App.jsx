import React, { useState } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import styled from 'styled-components';
import AppRouter from './routes/routes'
import { Sidebar } from './components/Sidebar'
import { BranchSelector } from './components/BranchSelector'
import { Light, Dark } from "./styles/Themes";
import { ThemeProvider } from "styled-components";
import { BranchProvider } from './context/BranchContext'
import Inventory from "./pages/Inventory";
export const ThemeContext = React.createContext(null);

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  return (
    <AppWrapper>
      {!isLoginPage && <BranchSelector />}
      <Container className={!isLoginPage && sidebarOpen ? "sidebarState active" : ""} isLoginPage={isLoginPage}>
        {!isLoginPage && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
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
          <BranchProvider>
            <HashRouter>
              <AppContent />
            </HashRouter>
          </BranchProvider>
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
`;


const Content = styled.div`
  grid-column: ${({ isLoginPage }) => isLoginPage ? '1' : '2'};       
  height: 100%;     
  overflow-y: auto;    
  padding-left: ${({ isLoginPage }) => isLoginPage ? '0' : '1rem'};     
  padding-right: ${({ isLoginPage }) => isLoginPage ? '0' : '1rem'};
`;


export default App
