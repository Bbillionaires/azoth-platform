import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { Sidebar } from '@/components/ui/Sidebar'

export const metadata: Metadata = {
  title: 'Nexus — Team Revenue Platform',
  description: 'CRM · Campaigns · Team Inbox · Automations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
