import { Session } from 'next-auth'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Message } from '../../server/router/room'
import { trpc } from '../../utils/trpc'

const MessageItem: React.FC<{ message: Message; session: Session }> = ({
  message,
  session,
}) => {
  return (
    <li>
      {message.sender.name}: {message.message}
    </li>
  )
}

export default function RoomPage() {
  const { query } = useRouter()
  const roomId = query.roomId as string
  const { data: session } = useSession()
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])

  const { mutateAsync: sendMessageMutation } =
    trpc.useMutation('room.send-message')
  trpc.useSubscription(['room.onSendMessage', { roomId }], {
    onNext(newMessage) {
      setMessages((oldMessages) => {
        return [...oldMessages, newMessage]
      })
    },
  })

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn()}>Login</button>
      </div>
    )
  }

  return (
    <div>
      <ul>
        {messages.map((message) => {
          return (
            <MessageItem key={message.id} message={message} session={session} />
          )
        })}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessageMutation({ roomId, message })
          setMessage('')
        }}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={'What do you want to say'}
        />
        <br />
        <button type='submit'>Send Message</button>
      </form>
    </div>
  )
}
