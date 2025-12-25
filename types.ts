// Data Protocol definitions
// We cannot send raw File objects reliably over data channels, 
// so we wrap them in a protocol.

export enum PacketType {
  HEADER = 'HEADER',
  CHUNK = 'CHUNK',
  END = 'END',
  ACK = 'ACK',
  REJECT = 'REJECT',
  PING = 'PING',
  PONG = 'PONG'
}

export interface FileHeader {
  type: PacketType.HEADER;
  payload: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    chunkCount: number;
  };
}

export interface FileChunk {
  type: PacketType.CHUNK;
  payload: {
    index: number;
    data: ArrayBuffer; // Binary data
  };
}

export interface FileEnd {
  type: PacketType.END;
  payload: {
    id: string; // File ID to confirm completion
  };
}

export interface FileAck {
  type: PacketType.ACK;
  payload: {
    id: string;
  };
}

export interface FileReject {
  type: PacketType.REJECT;
  payload: {
    id: string;
  };
}

export interface PingPacket {
  type: PacketType.PING;
  payload: {
    timestamp: number;
  };
}

export interface PongPacket {
  type: PacketType.PONG;
  payload: {
    timestamp: number;
  };
}

export type DataPacket = FileHeader | FileChunk | FileEnd | FileAck | FileReject | PingPacket | PongPacket;

// Application State definitions

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TransferProgress {
  role: 'SENDER' | 'RECEIVER';
  fileName: string;
  totalSize: number;
  transferredSize: number;
  percentage: number;
  status: 'IDLE' | 'INCOMING' | 'WAITING' | 'TRANSFERRING' | 'COMPLETED' | 'ERROR';
  speed?: string; // e.g., "2.5 MB/s"
  errorMsg?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}