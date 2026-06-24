import { useState } from 'react'
import { useStore } from './context/StoreContext.jsx'
import BottomNav from './components/BottomNav.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ActiveWorkoutScreen from './screens/ActiveWorkoutScreen.jsx'
import TemplatesScreen from './screens/TemplatesScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import AnalyticsScreen from './screens/AnalyticsScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'

export default function App() {
  const { activeWorkout } = useStore()
  const [tab, setTab] = useState('home')

  function renderScreen() {
    switch (tab) {
      case 'home':
        // The active workout takes over the Home tab while in progress.
        return activeWorkout ? (
          <ActiveWorkoutScreen goTo={setTab} />
        ) : (
          <HomeScreen goTo={setTab} />
        )
      case 'templates':
        return <TemplatesScreen goTo={setTab} />
      case 'history':
        return <HistoryScreen goTo={setTab} />
      case 'analytics':
        return <AnalyticsScreen />
      case 'settings':
        return <SettingsScreen />
      default:
        return null
    }
  }

  return (
    <div className="min-h-full bg-bg text-ink">
      <main className="pb-20 max-w-md mx-auto">{renderScreen()}</main>
      <div className="max-w-md mx-auto">
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </div>
  )
}
