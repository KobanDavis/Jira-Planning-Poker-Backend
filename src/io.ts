import http from 'http'
import https from 'https'

import { Server } from 'socket.io'
import { Events } from './types'
import fs from 'fs'

const port = Number(process.env.PORT) || 5000

let options: https.ServerOptions = {}
let protocol: typeof http | typeof https

if (fs.existsSync('./client-key.pem') && fs.existsSync('./client-cert.pem')) {
	options.key = fs.readFileSync('./client-key.pem')
	options.cert = fs.readFileSync('./client-cert.pem')
	protocol = https
} else {
	protocol = http
}

const server = protocol
	.createServer(options, (_, res) => {
		res.writeHead(200)
		res.end('hello world\n')
	})
	.listen(port, () => console.log('Server started on port ' + port))

const io = new Server<Events.ClientToServer, Events.ServerToClient>(server, { cors: { origin: '*' } })

export default io
