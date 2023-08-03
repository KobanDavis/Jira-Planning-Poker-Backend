import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import { Events } from './types'

dotenv.config()
const port = process.env.PORT || 5000

const server = http.createServer()
server.listen(port, () => console.log('Server started on port ' + port))

const io = new Server<Events.ClientToServer, Events.ServerToClient>(server, { cors: { origin: '*' } })

export default io
