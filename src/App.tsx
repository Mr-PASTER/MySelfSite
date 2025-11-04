import { useState, useCallback, useMemo } from 'react'
import './App.css'
import Reviews from './components/Reviews'
import SpiderGame from './components/SpiderGame'
import Minesweeper from './components/Minesweeper'

type Tab = 'about' | 'spider' | 'minesweeper'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('about')

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
  }, [])

  const isGameContainer = useMemo(() =>
    activeTab === 'spider' || activeTab === 'minesweeper',
    [activeTab]
  )

  return (
    <div className="app">
      <div className={`container ${isGameContainer ? 'game-container' : ''}`}>
        <header className="header">
          <div className="avatar">
            <div className="avatar-circle">👨‍💻</div>
          </div>
          <h1 className="name">Программист-фрилансер</h1>
          <p className="tagline">Создаю современные веб-решения</p>
        </header>

        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => handleTabChange('about')}
          >
            О сайте
          </button>
          <button
            className={`tab ${activeTab === 'spider' ? 'active' : ''}`}
            onClick={() => handleTabChange('spider')}
          >
            Солитер-паук
          </button>
          <button
            className={`tab ${activeTab === 'minesweeper' ? 'active' : ''}`}
            onClick={() => handleTabChange('minesweeper')}
          >
            Сапёр
          </button>
        </nav>

        <main className="main">
          {activeTab === 'about' && (
            <>
              <section className="about">
                <h2>О себе</h2>
                <p>
                  Профессиональный разработчик с опытом создания веб-приложений.
                  Специализируюсь на разработке современных, функциональных и красивых решений
                  для вашего бизнеса.
                </p>
              </section>

              <Reviews />
              <section className="contacts">
                <h2>Контакты</h2>
                <div className="contact-list">
                  <a
                    href="https://t.me/PASTERt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-item"
                  >
                    <span className="contact-icon">📱</span>
                    <span className="contact-label">Telegram:</span>
                    <span className="contact-value">PASTERt</span>
                  </a>
                  <a
                    href="tel:+79206253320"
                    className="contact-item"
                  >
                    <span className="contact-icon">📞</span>
                    <span className="contact-label">Телефон:</span>
                    <span className="contact-value">+7 (920) 625-33-20</span>
                  </a>
                </div>
              </section>
            </>
          )}

          {activeTab === 'spider' && <SpiderGame />}

          {activeTab === 'minesweeper' && <Minesweeper />}
        </main>

        <footer className="footer">
          <p>© 2025. Готов к новым проектам!</p>
        </footer>
      </div>
    </div>
  )
}

export default App
