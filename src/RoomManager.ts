import Room from './Room'

class RoomManager extends Map<string, Room> {
	public create(name: string, ownerId: string, sprintId: number) {
		const room = new Room(name, ownerId, sprintId)
		this.set(room.id, room)
		return room
	}

	public remove(id: string) {
		const room = this.get(id)
		if (!room) {
			return console.log(`Room with id '${id}' does not exist.`)
		}
		room.teardown()
		this.remove(id)
	}
}

export default new RoomManager()
