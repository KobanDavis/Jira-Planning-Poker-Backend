import RoomManager from './RoomManager'
import io from './io'
import { Events, Game } from './types'

class Room {
	private _state: Game.State = Game.State.LOBBY
	private _players = new Map<string, Game.Player>()
	private _history = new Map<string, Game.Round>()
	private _cards = new Map<string, Game.Card>()

	public id: string = Math.random().toString().slice(2, 8)

	constructor(public ownerId: string) {}

	private _playerWithoutSocket(player: Game.Player): Game.ClientPlayer {
		return Object.assign({}, player, { socket: undefined })
	}

	private _values<T, K>(map: Map<T, K>) {
		return Array.from(map.values())
	}

	private _getPlayersArray() {
		return this._values(this._players).map(this._playerWithoutSocket)
	}

	private _initPlayer(player: Game.Player) {
		player.socket.emit('ingame/init', {
			cards: this._values(this._cards),
			history: this._values(this._history),
			self: this._playerWithoutSocket(player)
		})

		io.to(this.id).emit('ingame/players', this._getPlayersArray())
		io.to(this.id).emit('ingame/state', this._state)
	}

	private _subscribeToEvents(player: Game.Player) {
		player.socket.on('ingame/state', (state) => {
			this._state = state
			io.to(this.id).emit('ingame/state', this._state)
		})

		player.socket.on('ingame/card', (card) => {
			this._cards.set(card.id, card)
			const cards = this._values(this._cards)
			player.socket.broadcast.to(this.id).emit('ingame/cards', cards)
		})
	}

	public teardown() {
		for (const player of this._players.values()) {
			this.disconnect(player)
		}
	}

	public connect(player: Game.Player): Game.Player {
		const existingPlayer = this._players.get(player.id)
		if (existingPlayer) {
			existingPlayer.socket = player.socket
		} else {
			this._players.set(player.id, player)
		}

		player.socket.join(this.id)

		this._subscribeToEvents(player)
		this._initPlayer(player)

		return player
	}

	public disconnect(player: Game.Player) {
		console.log('room/disconnect', player.name)

		player.socket.leave(this.id)
		this._players.delete(player.id)

		// if (this._players.size === 0) {
		// 	console.log('room/delete', this.id)
		// 	RoomManager.delete(this.id)
		// }
	}
}

export default Room
