import { createRouter } from './context'
import { z } from 'zod'
import { Events } from '../../constants/events'
import { randomUUID } from 'crypto'
import * as trpc from '@trpc/server'

// types
const msgSubSchema = z.object({ roomId: z.string() })
const messageSchema = z.object({
  id: z.string(),
  message: z.string(),
  roomId: z.string(),
  sentAt: z.date(),
  sender: z.object({ name: z.string() }),
})
export type Message = z.TypeOf<typeof messageSchema>

// router
export const roomRouter = createRouter()
  .mutation('send-message', {
    input: z.object({ roomId: z.string(), message: z.string() }),
    async resolve({ ctx, input }) {
      const message: Message = {
        ...input,
        id: randomUUID(),
        sentAt: new Date(),
        sender: { name: ctx.session?.user?.name || 'unknown' },
      }

      ctx.ee.emit(Events.SEND_MESSAGE, message)
      return true
    },
  })
  .subscription('onSendMessage', {
    input: z.object({ roomId: z.string() }),
    async resolve({ ctx, input }) {
      return new trpc.Subscription<Message>((emit) => {
        function onMesssage(data: Message) {
          if (input.roomId === data.roomId) {
            emit.data(data)
          }
        }

        ctx.ee.on(Events.SEND_MESSAGE, onMesssage)

        return () => {
          ctx.ee.off(Events.SEND_MESSAGE, onMesssage)
        }
      })
    },
  })
