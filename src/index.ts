import Room from './Room'
import RoomManager from './RoomManager'
import io from './io'
import { Game } from './types'

const timeoutMap: Record<string, NodeJS.Timeout> = {}
const timeouts = {
	// if room created, wait 100s before deleting automatically
	room(room: Room) {
		timeoutMap[room.id] = setTimeout(() => {
			room.teardown()
			console.log('timeout/room', room.id)
			RoomManager.delete(room.id)
		}, 100000)
	},
	// if player disconnects, wait 10s before removing from room
	player(player: Game.Player, room: Room) {
		console.log('timeout/player', player.name)
		timeoutMap[player.id] = setTimeout(() => room.disconnect(player), 10000)
	}
}

io.on('connection', (socket) => {
	socket.on('ping', (cb) => cb())
	socket.on('room/name', (roomId, cb) => {
		const room = RoomManager.get(roomId)
		if (!room) return console.log('err@room/name: room does not exist:', roomId)
		cb(room.name)
	})
	socket.on('room/exists', (roomId, cb) => cb(RoomManager.has(roomId)))
	socket.once('room/create', ({ roomName, playerId, sprintId }, cb) => {
		const room = RoomManager.create(roomName, playerId, sprintId)
		console.log('room/create', room.id, playerId)
		timeouts.room(room)
		cb(room.id)
	})

	socket.once('room/join', ({ name, id, roomId }, cb) => {
		console.log('room/join', name, socket.id)

		const room = RoomManager.get(roomId)

		if (!room) {
			return console.log('err@room/join: room does not exist:', roomId)
		}

		const player: Game.Player = { id, name, role: id === room.ownerId ? 'owner' : 'player', socket }

		if (roomId in timeoutMap) clearTimeout(timeoutMap[roomId])
		if (player.id in timeoutMap) clearTimeout(timeoutMap[player.id])

		socket.once('disconnect', () => timeouts.player(player, room))
		room.connect(player)

		cb(room.hasRounds() === false ? room.sprintId : undefined)
	})
})
