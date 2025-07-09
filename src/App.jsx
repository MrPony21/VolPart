import React, { useState } from 'react'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import styled from 'styled-components';
import AppRouter from './routes/routes'
import { Sidebar } from './components/Sidebar'
import { Light, Dark } from "./styles/Themes";
import { ThemeProvider } from "styled-components";
import Inventory from "./pages/Inventory";
export const ThemeContext = React.createContext(null);


function App() {
  const [theme, setTheme] = useState("light")
  const themeStyle = theme === "light" ? Light : Dark;

  const [count, setCount] = useState(0)

  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <>
      <ThemeContext.Provider value={{ setTheme, theme }}>
        <ThemeProvider theme={themeStyle}>
          <HashRouter>
            <Container className={sidebarOpen ? "sidebarState active" : ""}>
              <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
              <Content>
                  <AppRouter />
              </Content>
            </Container>
          </HashRouter>
        </ThemeProvider>
      </ThemeContext.Provider>
    </>
  )
}
const Container = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  grid-template-columns: 90px auto;
  background: ${({ theme }) => theme.bgtotal};
  transition: all 0.3s;
  &.active {
    grid-template-columns: 300px auto;
  }
  color: ${({ theme }) => theme.text};
`;


const Content = styled.div`
  grid-column: 2;       
  height: 100%;     
  overflow-y: auto;    
  padding-left: 1rem;     
  padding-right: 1rem
`;


export default App
