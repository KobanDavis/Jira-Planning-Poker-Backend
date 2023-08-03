import { Socket } from 'socket.io'

export namespace Game {
	export enum State {
		NOT_JOINED,
		LOBBY,
		PREGAME,
		INGAME,
		POSTGAME
	}

	export type Role = 'player' | 'owner'

	export interface Player {
		name: string
		id: string
		socket: Socket<Events.ClientToServer, Events.ServerToClient>
		role: Role
		spectating?: false // todo
	}

	export type ClientPlayer = Omit<Player, 'socket'>

	export interface Card {
		id: string
		value: number | string
		name: string
	}

	export interface Round {
		id: string
		value: string
		title: string
	}
}

export namespace Events {
	export interface ClientToServer {
		ping: (cb: () => void) => void
		'room/create': (playerId: string, cb: (roomId: string) => void) => void
		'room/join': (data: { name: string; id: string; roomId: string }) => void
		'ingame/state': (state: Game.State) => void
		'ingame/card': (cards: Game.Card) => void
	}

	export interface ServerToClient {
		'ingame/init': (data: { cards: Game.Card[]; history: Game.Round[]; self: Game.ClientPlayer }) => void
		'ingame/state': (state: Game.State) => void
		'ingame/cards': (cards: Game.Card[]) => void
		'ingame/players': (players: Game.ClientPlayer[]) => void
	}
}
