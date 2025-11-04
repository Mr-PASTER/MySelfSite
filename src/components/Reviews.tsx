import { useState, useRef, useEffect, useCallback } from 'react'
import './Reviews.css'

interface Review {
    id: number
    name: string
    role: string
    text: string
    rating: number
}

const reviews: Review[] = [
    {
        id: 1,
        name: 'Алексей Петров',
        role: 'CEO, Стартап Инновации',
        text: 'Отличная работа! Проект был выполнен в срок, все требования учтены. Очень профессиональный подход и качественный код.',
        rating: 5
    },
    {
        id: 2,
        name: 'Мария Иванова',
        role: 'Маркетолог',
        text: 'Спасибо за создание современного и удобного сайта. Пользователи очень довольны, конверсия выросла на 30%.',
        rating: 5
    },
    {
        id: 3,
        name: 'Дмитрий Сидоров',
        role: 'Владелец бизнеса',
        text: 'Работа выполнена быстро и качественно. Разработчик всегда на связи, помог с доработками. Рекомендую!',
        rating: 5
    }
]

// Вынесенная функция для оптимизации
const renderStars = (rating: number): string => {
    return '⭐'.repeat(rating)
}

function Reviews() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scrollToReview = useCallback((index: number) => {
        const container = scrollContainerRef.current
        if (!container) return

        const cards = container.querySelectorAll('.review-card') as NodeListOf<HTMLElement>
        if (cards[index]) {
            const card = cards[index]
            const containerRect = container.getBoundingClientRect()
            const cardRect = card.getBoundingClientRect()
            const scrollLeft = container.scrollLeft
            const relativeLeft = cardRect.left - containerRect.left + scrollLeft

            container.scrollTo({
                left: relativeLeft,
                behavior: 'smooth'
            })
            setCurrentIndex(index)
        }
    }, [])

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prevIndex => {
            const newIndex = prevIndex > 0 ? prevIndex - 1 : reviews.length - 1
            scrollToReview(newIndex)
            return newIndex
        })
    }, [scrollToReview])

    const goToNext = useCallback(() => {
        setCurrentIndex(prevIndex => {
            const newIndex = prevIndex < reviews.length - 1 ? prevIndex + 1 : 0
            scrollToReview(newIndex)
            return newIndex
        })
    }, [scrollToReview])

    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        let ticking = false
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const cards = container.querySelectorAll('.review-card') as NodeListOf<HTMLElement>
                    if (cards.length === 0) {
                        ticking = false
                        return
                    }

                    const containerRect = container.getBoundingClientRect()
                    const containerCenter = containerRect.left + containerRect.width / 2

                    let closestIndex = 0
                    let closestDistance = Infinity

                    cards.forEach((card, index) => {
                        const cardRect = card.getBoundingClientRect()
                        const cardCenter = cardRect.left + cardRect.width / 2
                        const distance = Math.abs(cardCenter - containerCenter)

                        if (distance < closestDistance) {
                            closestDistance = distance
                            closestIndex = index
                        }
                    })

                    if (closestIndex >= 0 && closestIndex < reviews.length) {
                        setCurrentIndex(prevIndex => {
                            if (prevIndex !== closestIndex) {
                                return closestIndex
                            }
                            return prevIndex
                        })
                    }
                    ticking = false
                })
                ticking = true
            }
        }

        container.addEventListener('scroll', handleScroll, { passive: true })
        return () => container.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <section className="reviews">
            <h2>Отзывы клиентов</h2>
            <div className="reviews-container">
                <button
                    className="review-nav-btn review-nav-btn-prev"
                    onClick={goToPrevious}
                    aria-label="Предыдущий отзыв"
                >
                    ‹
                </button>
                <div className="reviews-list" ref={scrollContainerRef}>
                    {reviews.map((review) => (
                        <div key={review.id} className="review-card">
                            <div className="review-header">
                                <div className="review-avatar">
                                    {review.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="review-info">
                                    <h3 className="review-name">{review.name}</h3>
                                    <p className="review-role">{review.role}</p>
                                </div>
                            </div>
                            <div className="review-rating">
                                {renderStars(review.rating)}
                            </div>
                            <p className="review-text">{review.text}</p>
                        </div>
                    ))}
                </div>
                <button
                    className="review-nav-btn review-nav-btn-next"
                    onClick={goToNext}
                    aria-label="Следующий отзыв"
                >
                    ›
                </button>
            </div>
        </section>
    )
}

export default Reviews

