import { Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/components/shared/ThemeProvider"
import { LoginPage } from "@/pages/LoginPage"
import { EmployeePage } from "@/pages/EmployeePage"
import { HrPage } from "@/pages/HrPage"
import { EmployeeLoginPage } from "@/pages/EmployeeLoginPage"
import { HrLoginPage } from "@/pages/HrLoginPage"

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/employee-login" element={<EmployeeLoginPage />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/hr-login" element={<HrLoginPage />} />
        <Route path="/hr" element={<HrPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
