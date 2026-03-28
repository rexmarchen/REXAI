import styles from '@/styles/landing.module.css'

const testimonials = [
  {
    name: 'Arjun Mehta',
    college: 'IIT Bombay, 2024',
    result: '3 Interviews in 2 Days',
    quote: 'Outreach Automation finally made cold email volume feel high-quality instead of noisy. I got replies faster than from portals.',
  },
  {
    name: 'Sneha Rao',
    college: 'VIT Vellore',
    result: '₹18k micro-gig → PPO',
    quote: 'The arena gave me a real hiring signal. Shipping one tight sprint mattered more than sending another hundred applications.',
  },
  {
    name: 'Rohan Singh',
    college: 'Delhi University',
    result: '12 LPA Offer',
    quote: 'The resume and matching flow made my story sharper. Recruiters started responding to me like I already belonged in the room.',
  },
]

export function TestimonialCards() {
  return (
    <div className={styles.testimonialGrid}>
      {testimonials.map((testimonial) => (
        <article key={testimonial.name} className={styles.testimonialCard}>
          <div className={styles.testimonialMeta}>
            <span className={styles.avatar}>{testimonial.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{testimonial.name}</strong>
              <div>{testimonial.college}</div>
              <span className={styles.resultTag}>{testimonial.result}</span>
            </div>
          </div>
          <p>{testimonial.quote}</p>
        </article>
      ))}
    </div>
  )
}
