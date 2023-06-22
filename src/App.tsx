import './App.css'
import { Route , Routes } from 'react-router-dom'
import Login from './components/Authorization/Login'
import UserProvider from './contexts/UserContext'
import SignUp from './components/Authorization/SingUp'
import MainPage from './components/MainPage/MainPage'
import TextDocumentComponent from './components/TextDocumentComponent'
import SnackbarProvider from './contexts/SnackBarContext'
import SnackBars from './components/MainPage/SnackBars'


function App() {

  return (
    <div className="App">
      <SnackbarProvider>
        <UserProvider>
          <Routes>
            <Route path="/sign-up" element={<SignUp />}/>
            <Route path="/login" element={<Login />}/>
            <Route path="/textDocument/:id" element={<TextDocumentComponent />}/>
            <Route path="/" element={<MainPage/>}/>
          </Routes>
          <SnackBars></SnackBars>
        </UserProvider>
      </SnackbarProvider>
    </div>
  )
}

export default App
