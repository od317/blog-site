// lib/socket/roomManager.ts
type RoomCleanupFunction = () => void;

class RoomManager {
  private activeRooms: Set<string> = new Set();
  private cleanupFunctions: Map<string, RoomCleanupFunction> = new Map();

  addRoom(roomName: string, cleanup?: RoomCleanupFunction) {
    this.activeRooms.add(roomName);
    if (cleanup) {
      this.cleanupFunctions.set(roomName, cleanup);
    }
    console.log(`📝 RoomManager: Added room ${roomName}. Active rooms:`, [
      ...this.activeRooms,
    ]);
  }

  removeRoom(roomName: string) {
    this.activeRooms.delete(roomName);
    const cleanup = this.cleanupFunctions.get(roomName);
    if (cleanup) {
      cleanup();
      this.cleanupFunctions.delete(roomName);
    }
    console.log(`📝 RoomManager: Removed room ${roomName}. Active rooms:`, [
      ...this.activeRooms,
    ]);
  }

  getActiveRooms(): string[] {
    return [...this.activeRooms];
  }

  clearAll() {
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.activeRooms.clear();
    this.cleanupFunctions.clear();
  }
}

export const roomManager = new RoomManager();
