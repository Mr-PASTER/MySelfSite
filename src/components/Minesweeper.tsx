import { useState, useEffect, useCallback } from 'react'
import './Minesweeper.css'

type Cell = {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
}

type GameStatus = 'playing' | 'won' | 'lost'

const BOARD_SIZE = 16
const MINE_COUNT = 40

// Вынесенные константы для оптимизации
const CELL_COLORS = ['', 'blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'] as const
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
]

// Функция подсчета соседних мин (вынесена для оптимизации)
const countAdjacentMines = (board: Cell[][], row: number, col: number): number => {
  let count = 0
  for (const [di, dj] of DIRECTIONS) {
    const ni = row + di
    const nj = col + dj
    if (ni >= 0 && ni < BOARD_SIZE && nj >= 0 && nj < BOARD_SIZE && board[ni][nj].isMine) {
      count++
    }
  }
  return count
}

function Minesweeper() {
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing')
  const [firstClick, setFirstClick] = useState(true)

  const initializeBoard = useCallback((firstClickRow?: number, firstClickCol?: number): Cell[][] => {
    const newBoard: Cell[][] = []
    
    // Создаем пустую доску
    for (let i = 0; i < BOARD_SIZE; i++) {
      newBoard[i] = []
      for (let j = 0; j < BOARD_SIZE; j++) {
        newBoard[i][j] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        }
      }
    }

    // Оптимизированное размещение мин (используем Set для отслеживания занятых позиций)
    const excludedPositions = new Set<string>()
    if (firstClickRow !== undefined && firstClickCol !== undefined) {
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          const row = firstClickRow + di
          const col = firstClickCol + dj
          if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            excludedPositions.add(`${row},${col}`)
          }
        }
      }
    }

    let minesPlaced = 0
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * BOARD_SIZE)
      const col = Math.floor(Math.random() * BOARD_SIZE)
      const posKey = `${row},${col}`
      
      if (!excludedPositions.has(posKey) && !newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true
        minesPlaced++
      }
    }

    // Подсчитываем соседние мины
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!newBoard[i][j].isMine) {
          newBoard[i][j].adjacentMines = countAdjacentMines(newBoard, i, j)
        }
      }
    }

    return newBoard
  }, [])

  useEffect(() => {
    setBoard(initializeBoard())
    setGameStatus('playing')
    setFirstClick(true)
  }, [initializeBoard])

  const revealCell = useCallback((row: number, col: number) => {
    setBoard(prevBoard => {
      if (gameStatus !== 'playing') return prevBoard
      if (prevBoard[row]?.[col]?.isRevealed || prevBoard[row]?.[col]?.isFlagged) return prevBoard

      let newBoard = prevBoard.map(r => r.map(c => ({ ...c })))
      
      // Первый клик - инициализируем доску так, чтобы на первой клетке не было мины
      if (firstClick) {
        newBoard = initializeBoard(row, col)
        setFirstClick(false)
      }

      const cell = newBoard[row][col]
      
      if (cell.isMine) {
        // Игра проиграна - открываем все мины (оптимизированная версия)
        for (let i = 0; i < BOARD_SIZE; i++) {
          for (let j = 0; j < BOARD_SIZE; j++) {
            if (newBoard[i][j].isMine) {
              newBoard[i][j].isRevealed = true
            }
          }
        }
        setGameStatus('lost')
      } else {
        // Оптимизированное раскрытие через очередь (итеративный подход вместо рекурсии)
        const queue: [number, number][] = [[row, col]]
        const processed = new Set<string>()
        
        while (queue.length > 0) {
          const [r, c] = queue.shift()!
          const key = `${r},${c}`
          
          if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) continue
          if (processed.has(key)) continue
          if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue
          
          processed.add(key)
          newBoard[r][c].isRevealed = true
          
          // Если клетка пустая, добавляем соседей в очередь
          if (newBoard[r][c].adjacentMines === 0) {
            for (const [di, dj] of DIRECTIONS) {
              queue.push([r + di, c + dj])
            }
          }
        }
        
        // Проверяем победу (оптимизированная проверка)
        let revealedCount = 0
        for (let i = 0; i < BOARD_SIZE; i++) {
          for (let j = 0; j < BOARD_SIZE; j++) {
            if (newBoard[i][j].isRevealed && !newBoard[i][j].isMine) {
              revealedCount++
            }
          }
        }
        
        if (revealedCount === BOARD_SIZE * BOARD_SIZE - MINE_COUNT) {
          setGameStatus('won')
          // Отмечаем все мины флагами
          for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
              if (newBoard[i][j].isMine) {
                newBoard[i][j].isFlagged = true
              }
            }
          }
        }
      }

      return newBoard
    })
  }, [gameStatus, firstClick, initializeBoard])

  const toggleFlag = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault()
    setBoard(prevBoard => {
      if (gameStatus !== 'playing') return prevBoard
      if (prevBoard[row]?.[col]?.isRevealed) return prevBoard

      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })))
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged
      return newBoard
    })
  }, [gameStatus])

  const resetGame = useCallback(() => {
    setBoard(initializeBoard())
    setGameStatus('playing')
    setFirstClick(true)
  }, [initializeBoard])

  const getCellContent = useCallback((cell: Cell): string => {
    if (cell.isFlagged) return '🚩'
    if (!cell.isRevealed) return ''
    if (cell.isMine) return '💣'
    if (cell.adjacentMines === 0) return ''
    return cell.adjacentMines.toString()
  }, [])

  const getCellColor = useCallback((cell: Cell): string => {
    if (!cell.isRevealed) return ''
    if (cell.isMine) return 'mine'
    return CELL_COLORS[cell.adjacentMines] || ''
  }, [])

  return (
    <div className="minesweeper">
      <div className="game-header">
        <h2>Сапёр</h2>
        <button onClick={resetGame} className="new-game-btn">
          Новая игра
        </button>
      </div>

      {gameStatus === 'won' && (
        <div className="game-status won">
          <h3>🎉 Поздравляем! Вы выиграли! 🎉</h3>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="game-status lost">
          <h3>💥 Игра окончена! Вы проиграли! 💥</h3>
        </div>
      )}

      <div className="minesweeper-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => {
              const cellContent = getCellContent(cell)
              const cellColor = getCellColor(cell)
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`cell ${cell.isRevealed ? 'revealed' : ''} ${cellColor} ${cell.isFlagged ? 'flagged' : ''}`}
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                >
                  {cellContent}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="game-instructions">
        <p>Правила: Кликните на клетку, чтобы открыть её. Правый клик ставит флаг.</p>
        <p>Найдите все мины, не подорвавшись!</p>
      </div>
    </div>
  )
}

export default Minesweeper

