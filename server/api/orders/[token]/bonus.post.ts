import { randomInt } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function bonusCode(): string {
  let s = ''
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)]
  return `PR-${s.slice(0, 4)}-${s.slice(4)}`
}

/**
 * Issues a bonus for the NEXT order after the mini-game. One code per order (unique
 * constraint), never changes the current order's price. There is no anti-cheat: the
 * owner checks and applies the code manually.
 */
export default defineEventHandler(async (event) => {
  await rateLimit(event, 'bonus', 10, 600)
  const { db, row, view } = await loadPublicOrder(event)
  const game = await getSetting('game')
  if (game.mode !== 'bonus' || game.bonusAmount <= 0) return { bonus: null, mode: game.mode }
  if (row.status === 'cancelled') throw createError({ statusCode: 409, message: 'Заявку скасовано' })
  if (view.bonus) return { bonus: view.bonus, mode: game.mode }

  const code = bonusCode()
  await db.query(
    `INSERT INTO bonus_codes (code, order_id, amount, min_order, expires_at)
     VALUES ($1, $2, $3, $4, now() + make_interval(days => $5))
     ON CONFLICT (order_id) DO NOTHING`,
    [code, row.id, game.bonusAmount, game.minNextOrder, game.validDays],
  )
  await logEvent(db, row.id, 'bonus_issued', { amount: game.bonusAmount })
  const fresh = await loadPublicOrder(event)
  return { bonus: fresh.view.bonus, mode: game.mode }
})
