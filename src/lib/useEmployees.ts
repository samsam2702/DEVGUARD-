import { useState, useEffect, useCallback } from "react"

export interface Employee {
  id: string
  employeeId: string
  name: string
  role: string
  department: string
  email: string
  joinDate: string // "YYYY-MM-DD"
  username?: string // linked login username
}

const API_BASE = "/api/employees"

export function calcTenure(joinDate: string): string {
  if (!joinDate) return "—"
  // joinDate is stored as YYYY-MM-DD
  const [year, month, day] = joinDate.split("-").map(Number)
  const start = new Date(year, month - 1, day)
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years === 0 && months === 0) return "< 1 month"
  const parts: string[] = []
  if (years > 0) parts.push(`${years} yr${years !== 1 ? "s" : ""}`)
  if (months > 0) parts.push(`${months} mo`)
  return parts.join(" ")
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(API_BASE)
      const data = await res.json()
      setEmployees(data)
    } catch (err) {
      console.error("Failed to fetch employees:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const addEmployee = useCallback(async (emp: Omit<Employee, "id">) => {
    const id = crypto.randomUUID()
    await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...emp }),
    })
    await fetchEmployees()
  }, [fetchEmployees])

  const updateEmployee = useCallback(async (id: string, data: Omit<Employee, "id">) => {
    await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    await fetchEmployees()
  }, [fetchEmployees])

  const removeEmployee = useCallback(async (id: string) => {
    await fetch(`${API_BASE}/${id}`, { method: "DELETE" })
    await fetchEmployees()
  }, [fetchEmployees])

  return { employees, addEmployee, updateEmployee, removeEmployee, loading, refetch: fetchEmployees }
}