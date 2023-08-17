import io from './io'
import { Game } from './types'

class Room {
	private _state: Game.State = Game.State.LOBBY
	private _players = new Map<string, Game.Player>()
	private _cards = new Map<string, Game.Card>()

	private _rounds = new Map<string, Game.Round>()
	private _currentRound: string = ''

	public id: string

	constructor(public name: string, public ownerId: string, public sprintId: number) {
		this.id = ownerId
	}

	private _playerWithoutSocket(player: Game.Player): Game.ClientPlayer {
		return Object.assign({}, player, { socket: undefined })
	}

	private _values<T, K>(iterable: Map<T, K> | Set<K>) {
		return Array.from(iterable.values())
	}

	private _getPlayersArray() {
		return this._values(this._players).map(this._playerWithoutSocket)
	}

	private _initPlayer(player: Game.Player) {
		player.socket.emit('ingame/init', {
			cards: this._values(this._cards),
			rounds: this._values(this._rounds),
			self: this._playerWithoutSocket(player),
			currentRound: this._currentRound,
			state: this._state
		})

		io.to(this.id).emit('ingame/players', this._getPlayersArray())
	}

	private _subscribeToEvents(player: Game.Player) {
		if (player.role === 'owner') {
			player.socket.on('ingame/state', (state) => {
				this._state = state
				io.to(this.id).emit('ingame/state', this._state)
			})
			player.socket.on('ingame/rounds', (rounds) => {
				rounds.forEach((round) => {
					this._rounds.set(round.id, round)
				})
				io.to(this.id).emit('ingame/rounds', rounds)
			})
			player.socket.on('ingame/round', (round) => {
				this._rounds.set(round.id, round)
				const rounds = this._values(this._rounds)
				io.to(this.id).emit('ingame/rounds', rounds)
			})
			player.socket.on('ingame/currentRound', (round) => {
				this._currentRound = round
				io.to(this.id).emit('ingame/currentRound', this._currentRound)
			})
		}

		player.socket.on('ingame/card', (card) => {
			this._cards.set(card.id, card)
			const cards = this._values(this._cards)
			io.to(this.id).emit('ingame/cards', cards)
		})
	}

	public hasRounds() {
		return this._rounds.size > 0
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
