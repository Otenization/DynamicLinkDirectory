import fp from 'fastify-plugin'
import { Op } from 'sequelize'
import { cronManager, log } from '../../lib/utility.js'

export default fp(async function (fastify, opts) {

    // Remove expired session tokens so the table doesn't grow unbounded.
    const purgeExpiredSessions = async () => {
        if (!fastify.db?.Sessions) return 0
        const removed = await fastify.db.Sessions.destroy({
            where: { expires_at: { [Op.lt]: new Date() } },
        })
        if (removed > 0) {
            await log(`Purged ${removed} expired session(s)`, 'info', import.meta.url)
        }
        return removed
    }

    // Daily at 03:00.
    cronManager.createJob('purge-expired-sessions', '0 3 * * *', async () => {
        await purgeExpiredSessions()
    }, { isLog: false })

    fastify.addHook('onReady', async () => {
        cronManager.startAll()
        await log('Cron jobs started', import.meta.url)
        // Also sweep once at startup so stale rows clear without waiting for 03:00.
        await purgeExpiredSessions()
    })

    fastify.addHook('onClose', async () => {
        cronManager.stopAll()
    })

    // Decorate fastify with cronManager for easy access
    fastify.decorate('cronManager', cronManager)

})
