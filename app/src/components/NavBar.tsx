import { NavLink } from 'react-router-dom'
import type { DashboardData } from '../types/dashboard'

export function NavBar({ data }: { data: DashboardData }) {
  return (
    <nav className="navbar">
      <div className="navbar-title">
        <strong>{data.school}</strong>
        <span className="soft mono">Class {data.className}</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}>
          Overview
        </NavLink>
        {data.subjects.map((s) => (
          <NavLink key={s} to={`/subject/${encodeURIComponent(s)}`} className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}>
            {s}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
