import { useState, useEffect, useCallback } from 'react'
import './SpiderGame.css'

type Suit = '♠' | '♥' | '♦' | '♣'
type Card = {
  suit: Suit
  value: number
  isFaceUp: boolean
  id: string
}

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

// Вынесенные функции для оптимизации
const VALUE_MAP: { [key: number]: string } = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
}

function createDeck(): Card[] {
  const deck: Card[] = []
  let id = 0
  // Создаем две колоды для игры "Солитер-паук" (104 карты)
  for (let deckNumber = 0; deckNumber < 2; deckNumber++) {
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value, isFaceUp: false, id: `card-${id++}` })
      }
    }
  }
  return shuffle(deck)
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getCardDisplay(card: Card): string {
  if (!card.isFaceUp) return '🂠'
  return `${VALUE_MAP[card.value] || card.value}${card.suit}`
}

// Вынесенная функция для проверки возможности стека (оптимизация)
// В солитере-пауке карты должны быть одной масти и в нисходящей последовательности
const canStackCards = (card1: Card, card2: Card): boolean => {
  return card1.suit === card2.suit && card1.value === card2.value + 1
}

function SpiderGame() {
  const [gameWon, setGameWon] = useState(false)
  const [columns, setColumns] = useState<Card[][]>([])
  const [selectedCards, setSelectedCards] = useState<{ columnIndex: number; cardIndex: number }[]>([])
  const [foundations, setFoundations] = useState<{ [key: string]: number }>({
    '♠': 0,
    '♥': 0,
    '♦': 0,
    '♣': 0
  })

  const initializeGame = useCallback(() => {
    const deck = createDeck()
    const newColumns: Card[][] = []
    
    // Раскладка: 6 колонок по 5 карт, 4 колонки по 6 карт
    let cardIndex = 0
    for (let col = 0; col < 10; col++) {
      const cardsInColumn = col < 4 ? 6 : 5
      const column: Card[] = []
      for (let i = 0; i < cardsInColumn; i++) {
        const card = deck[cardIndex++]
        if (i === cardsInColumn - 1) {
          card.isFaceUp = true
        }
        column.push(card)
      }
      newColumns.push(column)
    }
    
    setColumns(newColumns)
    setSelectedCards([])
    setGameWon(false)
    setFoundations({ '♠': 0, '♥': 0, '♦': 0, '♣': 0 })
  }, [])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  const moveCards = useCallback((fromColumn: number, toColumn: number, fromIndex: number) => {
    if (fromColumn === toColumn) return
    
    setColumns(prevColumns => {
      const newColumns = prevColumns.map(col => [...col])
      const sourceColumn = newColumns[fromColumn]
      const targetColumn = newColumns[toColumn]
      
      if (!sourceColumn || !targetColumn) return prevColumns
      
      const topCard = targetColumn[targetColumn.length - 1]
      const cardToMove = sourceColumn[fromIndex]
      
      // Проверяем возможность перемещения: пустая колонка или карты одной масти в последовательности
      if (!cardToMove || (topCard && (!topCard.isFaceUp || !canStackCards(topCard, cardToMove)))) {
        return prevColumns
      }
      
      const cardsToMove = sourceColumn.splice(fromIndex)
      cardsToMove.forEach(card => targetColumn.push(card))
      
      // Открываем верхнюю карту в исходной колонке
      if (sourceColumn.length > 0) {
        sourceColumn[sourceColumn.length - 1].isFaceUp = true
      }
      
      // Проверка на завершенную последовательность (оптимизировано - без setTimeout)
      const column = newColumns[toColumn]
      if (column && column.length >= 13) {
        const sequence = column.slice(-13)
        const suit = sequence[0].suit
        
        // Проверяем, что это последовательность от K до A одной масти
        let isValid = true
        for (let i = 0; i < 13; i++) {
          if (sequence[i].value !== 13 - i || sequence[i].suit !== suit) {
            isValid = false
            break
          }
        }
        
        if (isValid) {
          newColumns[toColumn] = column.slice(0, -13)
          if (newColumns[toColumn].length > 0) {
            newColumns[toColumn][newColumns[toColumn].length - 1].isFaceUp = true
          }
          
          setFoundations(prevFoundations => {
            const newFoundations = { ...prevFoundations }
            newFoundations[suit] = (newFoundations[suit] || 0) + 1
            
            // Проверка победы
            if (Object.values(newFoundations).every(count => count === 2)) {
              setGameWon(true)
            }
            
            return newFoundations
          })
        }
      }
      
      return newColumns
    })
  }, [])

  const handleCardClick = useCallback((columnIndex: number, cardIndex: number) => {
    if (!columns || columns.length === 0) return
    const column = columns[columnIndex]
    if (!column || column.length === 0) return
    const card = column[cardIndex]
    if (!card) return
    
    if (!card.isFaceUp) return
    
    // Проверка на последовательность (одной масти)
    const clickedCard = column[cardIndex]
    const sequence: Card[] = [clickedCard]
    
    for (let i = cardIndex + 1; i < column.length; i++) {
      const prevCard = column[i - 1]
      const currCard = column[i]
      
      // Проверяем, что карты одной масти и в нисходящей последовательности
      if (currCard.isFaceUp && 
          currCard.suit === prevCard.suit &&
          currCard.value === prevCard.value - 1) {
        sequence.push(currCard)
      } else {
        break
      }
    }
    
    // Если кликнули на уже выбранную карту, снимаем выбор
    const isAlreadySelected = selectedCards.some(
      sel => sel.columnIndex === columnIndex && sel.cardIndex === cardIndex
    )
    if (isAlreadySelected) {
      setSelectedCards([])
      return
    }
    
    if (sequence.length === 1 && selectedCards.length === 0) {
      setSelectedCards([{ columnIndex, cardIndex }])
    } else if (sequence.length > 1 && selectedCards.length === 0) {
      const newSelection = sequence.map((_, idx) => ({
        columnIndex,
        cardIndex: cardIndex + idx
      }))
      setSelectedCards(newSelection)
    } else if (selectedCards.length > 0) {
      // Попытка переместить
      const sourceColIndex = selectedCards[0].columnIndex
      if (sourceColIndex !== columnIndex && columns[sourceColIndex] && columns[columnIndex]) {
        const targetColumn = columns[columnIndex]
        const sourceColumn = columns[sourceColIndex]
        const sourceCard = sourceColumn[selectedCards[0].cardIndex]
        const topCard = targetColumn[targetColumn.length - 1]
        
        // Проверяем, что можно переместить: либо пустая колонка, либо карты одной масти в последовательности
        if (sourceCard && (!topCard || (topCard.isFaceUp && canStackCards(topCard, sourceCard)))) {
          moveCards(sourceColIndex, columnIndex, selectedCards[0].cardIndex)
        }
      }
      setSelectedCards([])
    }
  }, [columns, selectedCards, moveCards])

  const isSelected = useCallback((columnIndex: number, cardIndex: number): boolean => {
    return selectedCards.some(
      sel => sel.columnIndex === columnIndex && sel.cardIndex === cardIndex
    )
  }, [selectedCards])

  // Функция для поиска возможного хода
  const findPossibleMove = useCallback((): { fromColumn: number; toColumn: number; fromIndex: number } | null => {
    if (!columns || columns.length === 0) return null

    // Проходим по всем колонкам
    for (let fromCol = 0; fromCol < columns.length; fromCol++) {
      const sourceColumn = columns[fromCol]
      if (!sourceColumn || sourceColumn.length === 0) continue

      // Находим все возможные последовательности открытых карт в колонке
      let startIndex = -1
      for (let i = sourceColumn.length - 1; i >= 0; i--) {
        if (sourceColumn[i].isFaceUp) {
          startIndex = i
          break
        }
      }

      if (startIndex === -1) continue

      // Находим полную последовательность карт одной масти
      const sequence: Card[] = [sourceColumn[startIndex]]
      for (let i = startIndex + 1; i < sourceColumn.length; i++) {
        const prevCard = sourceColumn[i - 1]
        const currCard = sourceColumn[i]
        
        if (currCard.isFaceUp && 
            currCard.suit === prevCard.suit &&
            currCard.value === prevCard.value - 1) {
          sequence.push(currCard)
        } else {
          break
        }
      }

      const sourceCard = sourceColumn[startIndex]

      // Проверяем, можно ли переместить эту последовательность в другую колонку
      for (let toCol = 0; toCol < columns.length; toCol++) {
        if (fromCol === toCol) continue

        const targetColumn = columns[toCol]
        if (!targetColumn) continue

        // Если колонка пустая, можно переместить любую открытую карту
        if (targetColumn.length === 0) {
          return { fromColumn: fromCol, toColumn: toCol, fromIndex: startIndex }
        }

        // Проверяем верхнюю карту целевой колонки
        const topCard = targetColumn[targetColumn.length - 1]
        if (topCard && topCard.isFaceUp && canStackCards(topCard, sourceCard)) {
          return { fromColumn: fromCol, toColumn: toCol, fromIndex: startIndex }
        }
      }
    }

    return null
  }, [columns])

  // Функция для выполнения подсказки
  const handleHint = useCallback(() => {
    const move = findPossibleMove()
    if (move) {
      moveCards(move.fromColumn, move.toColumn, move.fromIndex)
    }
  }, [findPossibleMove, moveCards])

  return (
    <div className="spider-game">
      <div className="game-header">
        <h2>Солитер-паук</h2>
        <div className="game-controls">
          <button onClick={handleHint} className="hint-btn">
            💡 Подсказка
          </button>
          <button onClick={initializeGame} className="new-game-btn">
            Новая игра
          </button>
        </div>
      </div>
      
      {gameWon && (
        <div className="game-won">
          <h3>🎉 Поздравляем! Вы выиграли! 🎉</h3>
        </div>
      )}
      
      <div className="foundations">
        {suits.map(suit => (
          <div key={suit} className="foundation">
            <div className="foundation-suit">{suit}</div>
            <div className="foundation-count">{foundations[suit]}/2</div>
          </div>
        ))}
      </div>
      
      <div className="game-board">
        {columns && columns.length > 0 ? (
          columns.map((column, colIndex) => (
            <div key={colIndex} className="column">
              {column.map((card, cardIndex) => {
                const selected = isSelected(colIndex, cardIndex)
                const cardDisplay = getCardDisplay(card)
                const isRed = card.suit === '♥' || card.suit === '♦'
                return (
                  <div
                    key={card.id}
                    className={`card ${card.isFaceUp ? 'face-up' : 'face-down'} ${selected ? 'selected' : ''}`}
                    onClick={() => handleCardClick(colIndex, cardIndex)}
                  >
                    {card.isFaceUp ? (
                      <span className={isRed ? 'red' : 'black'}>
                        {cardDisplay}
                      </span>
                    ) : (
                      <span>🂠</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            Загрузка игры...
          </div>
        )}
      </div>
      
      <div className="game-instructions">
        <p>Правила: Соберите 8 последовательностей от короля до туза (по 2 для каждой масти)</p>
        <p>Перемещайте карты, кликая на них. Можно перемещать последовательности карт.</p>
      </div>
    </div>
  )
}

export default SpiderGame

