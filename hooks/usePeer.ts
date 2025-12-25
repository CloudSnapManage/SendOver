import { useEffect, useState, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import JSZip from 'jszip';
import { ConnectionState, TransferProgress, DataPacket, PacketType, FileHeader, FileChunk, FileEnd, FileAck, FileReject, Notification } from '../types';

const PEER_ID_PREFIX = 'sendover-';
const CODE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const PING_INTERVAL_MS = 2000;

// Dynamic Chunk Size Strategy
// 16KB is the safe MTU-like limit to avoid fragmentation issues in some browsers (older Firefox).
// However, modern Chromium browsers can handle 64KB chunks efficiently.
const getOptimalChunkSize = () => {
  if (typeof navigator === 'undefined') return 16 * 1024;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('firefox')) return 16 * 1024; // Firefox is safer with 16KB
  return 64 * 1024; // Chromium/Others can usually handle 64KB
};

export const usePeer = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [conn, setConn] = useState<DataConnection | null>(null);
  const [nextRotationTime, setNextRotationTime] = useState<number | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  
  // Ref to track connection state inside timeouts/intervals without dependencies
  const connectionStateRef = useRef(connectionState);
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  // Transfer State
  const [progress, setProgress] = useState<TransferProgress>({
    role: 'SENDER', // Default, doesn't matter when IDLE
    fileName: '',
    totalSize: 0,
    transferredSize: 0,
    percentage: 0,
    status: 'IDLE'
  });

  // Refs
  const incomingFileRef = useRef<{
    meta: FileHeader['payload'] | null;
    buffer: ArrayBuffer[];
    receivedSize: number;
    blobUrl: string | null;
  }>({
    meta: null,
    buffer: [],
    receivedSize: 0,
    blobUrl: null
  });

  // Promise resolver for the Sender to wait for ACK
  const transferPromiseRef = useRef<{
    resolve: (value: boolean) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const showToast = useCallback((message: string, type: Notification['type'] = 'info') => {
    setNotification({
      id: Date.now().toString(),
      message,
      type
    });
  }, []);

  const dismissToast = useCallback(() => {
    setNotification(null);
  }, []);

  const disconnect = useCallback(() => {
    if (conn) {
      conn.close();
      setConn(null);
      setConnectionState(ConnectionState.DISCONNECTED);
      setLatency(null);
      showToast('Disconnected manually', 'info');
      
      // Trigger a peer rotation shortly after disconnect to ensure fresh state
      setTimeout(() => {
         // Logic to trigger rotation handled by the rotation effect watching connectionState
      }, 500);
    }
  }, [conn, showToast]);

  const handleConnection = useCallback((connection: DataConnection) => {
    setConnectionState(ConnectionState.CONNECTING);
    setNextRotationTime(null); // Stop timer when connection starts

    connection.on('open', () => {
      console.log('Connection established');
      setConnectionState(ConnectionState.CONNECTED);
      setConn(connection);
      showToast('Secure connection established', 'success');
    });

    connection.on('close', () => {
      console.log('Connection closed');
      setConnectionState(ConnectionState.DISCONNECTED);
      setConn(null);
      setLatency(null);
      showToast('Peer disconnected', 'warning');
    });

    connection.on('error', (err) => {
      console.error('Connection error:', err);
      // Don't kill the whole state for data channel errors, just notify
      showToast('Data connection interrupted', 'error');
    });

    connection.on('data', (data: unknown) => {
       handleIncomingData(data as DataPacket, connection);
    });
  }, [showToast]);

  // Handle incoming data
  // Modified to take the specific connection instance to ensure PONGs go to the right place
  const handleIncomingData = (packet: DataPacket, connection: DataConnection) => {
    const state = incomingFileRef.current;

    switch (packet.type) {
      case PacketType.PING:
        connection.send({ 
          type: PacketType.PONG, 
          payload: packet.payload 
        });
        break;

      case PacketType.PONG:
        const rtt = Date.now() - packet.payload.timestamp;
        setLatency(rtt);
        break;

      case PacketType.HEADER:
        // Receiver: Received a file request
        state.meta = packet.payload;
        state.buffer = [];
        state.receivedSize = 0;
        state.blobUrl = null;
        
        // Update UI to show acceptance dialog
        setProgress({
          role: 'RECEIVER',
          fileName: packet.payload.name,
          totalSize: packet.payload.size,
          transferredSize: 0,
          percentage: 0,
          status: 'INCOMING'
        });
        break;

      case PacketType.ACK:
        // Sender: Receiver accepted the file
        if (transferPromiseRef.current) {
          transferPromiseRef.current.resolve(true);
          transferPromiseRef.current = null;
        }
        break;

      case PacketType.REJECT:
        // Sender: Receiver rejected the file
        if (transferPromiseRef.current) {
          transferPromiseRef.current.resolve(false);
          transferPromiseRef.current = null;
        }
        break;

      case PacketType.CHUNK:
        if (!state.meta || progress.status === 'INCOMING') return; // Ignore chunks if not accepted yet
        
        state.buffer.push(packet.payload.data);
        state.receivedSize += packet.payload.data.byteLength;
        
        const percent = (state.receivedSize / state.meta.size) * 100;
        
        setProgress(prev => ({
          ...prev,
          transferredSize: state.receivedSize,
          percentage: percent,
          status: 'TRANSFERRING'
        }));
        break;

      case PacketType.END:
        if (!state.meta) return;
        
        const blob = new Blob(state.buffer, { type: state.meta.mimeType });
        const url = URL.createObjectURL(blob);
        state.blobUrl = url;

        setProgress(prev => ({
          ...prev,
          transferredSize: state.meta!.size,
          percentage: 100,
          status: 'COMPLETED'
        }));
        showToast('File transfer completed!', 'success');
        break;
    }
  };

  // Ping Interval
  useEffect(() => {
    if (!conn || connectionState !== ConnectionState.CONNECTED) return;

    const interval = setInterval(() => {
      conn.send({
        type: PacketType.PING,
        payload: { timestamp: Date.now() }
      });
    }, PING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conn, connectionState]);

  // Initialize Peer with auto-rotation
  useEffect(() => {
    let peerInstance: Peer | null = null;
    let rotationTimeout: number | undefined;
    let isMounted = true;

    const cleanup = () => {
        if (rotationTimeout) clearTimeout(rotationTimeout);
        if (peerInstance) {
            peerInstance.destroy();
            peerInstance = null;
        }
    };

    const initializePeer = (retryCount = 0) => {
      cleanup(); // Clean up previous instance and timer before creating new one
      
      if (!isMounted) return;
      
      // Stop infinite retries on fatal errors, but allow more retries for network
      if (retryCount > 10) {
        setConnectionState(ConnectionState.ERROR);
        showToast('Unable to connect to signaling server. Please refresh.', 'error');
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const id = `${PEER_ID_PREFIX}${code}`;

      console.log(`Initializing Peer with ID: ${id}`);
      const newPeer = new Peer(id);

      newPeer.on('open', (id) => {
        if (!isMounted) return;
        console.log('My Peer ID:', id);
        setMyPeerId(id);
        setPeer(newPeer);
        
        if (retryCount > 0) {
          showToast('Reconnected to network', 'success');
          setConnectionState(ConnectionState.DISCONNECTED); // Clear error state if we recovered
        }

        // Schedule next rotation
        const now = Date.now();
        const nextTime = now + CODE_TIMEOUT_MS;
        setNextRotationTime(nextTime);

        rotationTimeout = window.setTimeout(() => {
            // Only rotate if we are not connected and not connecting
            const currentState = connectionStateRef.current;
            if (currentState === ConnectionState.DISCONNECTED || currentState === ConnectionState.ERROR) {
                console.log("Rotating Peer ID due to timeout...");
                initializePeer(); 
            }
        }, CODE_TIMEOUT_MS);
      });

      newPeer.on('connection', (connection) => {
        if (!isMounted) return;
        console.log('Incoming connection from:', connection.peer);
        // Cancel rotation if someone connects
        if (rotationTimeout) clearTimeout(rotationTimeout);
        handleConnection(connection);
      });

      newPeer.on('error', (err: any) => {
        if (!isMounted) return;
        console.error('Peer error type:', err.type, err);
        
        switch (err.type) {
          case 'unavailable-id':
            // Collision, retry immediately
            initializePeer(retryCount + 1);
            break;

          case 'network':
          case 'peer-unavailable':
          case 'socket-error':
          case 'webrtc':
            // Transient errors - Show toast, don't set global Error state immediately unless it's persistent
            showToast(`Network issue: ${err.type}. Retrying...`, 'warning');
            // Small delay before retry to let network settle
            setTimeout(() => initializePeer(retryCount + 1), 2000);
            break;
            
          case 'browser-incompatible':
            setConnectionState(ConnectionState.ERROR);
            showToast('Your browser does not support WebRTC.', 'error');
            break;
            
          case 'invalid-id':
             // Usually user error in connection field, handled by connection logic, but if here:
             showToast('Invalid Peer ID.', 'error');
             break;

          default:
            // For unknown severe errors
            showToast(`Connection Error: ${err.type || 'Unknown'}`, 'error');
            // Optional: setConnectionState(ConnectionState.ERROR);
        }
      });

      peerInstance = newPeer;
    };

    initializePeer();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [handleConnection, showToast]);

  const connectToPeer = (inputPeerId: string) => {
    if (!peer) {
        showToast('Peer not initialized yet', 'error');
        return;
    }
    
    let targetId = inputPeerId.trim();
    if (/^\d{6}$/.test(targetId)) {
      targetId = `${PEER_ID_PREFIX}${targetId}`;
    }

    if (targetId === myPeerId) {
        showToast("You cannot connect to yourself", "warning");
        return;
    }

    try {
        const connection = peer.connect(targetId);
        if (!connection) {
             showToast("Could not create connection", "error");
             return;
        }
        handleConnection(connection);
    } catch (e) {
        console.error(e);
        showToast("Connection failed", "error");
    }
  };

  // Receiver Actions
  const acceptFile = () => {
    if (!conn || !incomingFileRef.current.meta) return;
    
    const ackPacket: FileAck = {
      type: PacketType.ACK,
      payload: { id: incomingFileRef.current.meta.id }
    };
    conn.send(ackPacket);
    
    // Update state to start receiving chunks
    setProgress(prev => ({ ...prev, status: 'TRANSFERRING' }));
  };

  const rejectFile = () => {
     if (!conn || !incomingFileRef.current.meta) return;
     
     const rejectPacket: FileReject = {
       type: PacketType.REJECT,
       payload: { id: incomingFileRef.current.meta.id }
     };
     conn.send(rejectPacket);

     // Reset state
     resetTransfer();
     showToast("File request rejected", "info");
  };

  const sendFiles = async (files: File[]) => {
    if (!conn || connectionState !== ConnectionState.CONNECTED || files.length === 0) {
      showToast("Not connected or no files selected", "error");
      return;
    }

    let fileToSend: File;

    try {
      if (files.length === 1) {
        fileToSend = files[0];
      } else {
        // Zip multiple files
        // UI indication that we are preparing
        setProgress({
          role: 'SENDER',
          fileName: `Compressing ${files.length} files...`,
          totalSize: 0,
          transferredSize: 0,
          percentage: 0,
          status: 'WAITING'
        });

        const zip = new JSZip();
        files.forEach(f => zip.file(f.name, f));
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        // Create a human-friendly timestamped name
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        fileToSend = new File([zipBlob], `SendOver_Bundle_${timestamp}.zip`, { type: 'application/zip' });
      }

      await transferSingleFile(fileToSend);

    } catch (err) {
      console.error("Preparation error:", err);
      setProgress(prev => ({
        ...prev,
        status: 'ERROR',
        errorMsg: 'Failed to prepare files for sending'
      }));
      showToast('Failed to prepare files', 'error');
    }
  };


  const transferSingleFile = async (file: File) => {
    const fileId = crypto.randomUUID();
    const chunkSize = getOptimalChunkSize(); // Optimize size

    // 1. Send Header
    const header: FileHeader = {
      type: PacketType.HEADER,
      payload: {
        id: fileId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        chunkCount: Math.ceil(file.size / chunkSize)
      }
    };
    
    conn?.send(header);

    // 2. Set Waiting State and Wait for ACK
    setProgress({
      role: 'SENDER',
      fileName: file.name,
      totalSize: file.size,
      transferredSize: 0,
      percentage: 0,
      status: 'WAITING'
    });

    try {
      // Create a promise that resolves when ACK/REJECT is received
      const accepted = await new Promise<boolean>((resolve, reject) => {
        transferPromiseRef.current = { resolve, reject };
      });

      if (!accepted) {
        setProgress(prev => ({ ...prev, status: 'ERROR', errorMsg: 'Transfer declined by peer' }));
        showToast('Peer declined the transfer', 'warning');
        return;
      }

      // 3. Start sending chunks if accepted
      setProgress(prev => ({ ...prev, status: 'TRANSFERRING' }));

      let offset = 0;
      let chunkIndex = 0;

      const readChunk = (start: number, end: number): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          const slice = file.slice(start, end);
          reader.onload = (e) => {
            if (e.target?.result) resolve(e.target.result as ArrayBuffer);
            else reject(new Error("Read failed"));
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(slice);
        });
      };

      while (offset < file.size) {
        const chunk = await readChunk(offset, offset + chunkSize);
        
        const dataChannel = (conn as any).dataChannel;
        // Optimization: Reduce backpressure threshold to 1MB for smoother performance
        // If buffer is full, wait a bit for it to drain
        if (dataChannel && dataChannel.bufferedAmount > 1024 * 1024) {
             await new Promise(r => setTimeout(r, 50));
        }

        const chunkPacket: FileChunk = {
          type: PacketType.CHUNK,
          payload: {
            index: chunkIndex,
            data: chunk
          }
        };

        conn?.send(chunkPacket);

        offset += chunk.byteLength;
        chunkIndex++;

        const percent = (offset / file.size) * 100;
        setProgress(prev => ({
          ...prev,
          transferredSize: offset,
          percentage: percent
        }));
        
        // Small yield every few chunks to prevent blocking main thread
        if (chunkIndex % 50 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const endPacket: FileEnd = {
        type: PacketType.END,
        payload: { id: fileId }
      };
      conn?.send(endPacket);

      setProgress(prev => ({
        ...prev,
        status: 'COMPLETED'
      }));
      showToast('File sent successfully', 'success');

    } catch (err) {
      console.error("Transfer error:", err);
      setProgress(prev => ({
        ...prev,
        status: 'ERROR',
        errorMsg: 'Connection lost or transfer failed'
      }));
      showToast('Transfer interrupted', 'error');
    } finally {
      transferPromiseRef.current = null;
    }
  };

  const downloadReceivedFile = () => {
    const { blobUrl, meta } = incomingFileRef.current;
    if (blobUrl && meta) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = meta.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Download started', 'info');
    }
  };

  const resetTransfer = () => {
    setProgress({
      role: 'SENDER',
      fileName: '',
      totalSize: 0,
      transferredSize: 0,
      percentage: 0,
      status: 'IDLE'
    });
    incomingFileRef.current.blobUrl = null;
    incomingFileRef.current.buffer = [];
  };

  return {
    myPeerId,
    connectionState,
    progress,
    connectToPeer,
    disconnect,
    sendFile: sendFiles, 
    acceptFile,
    rejectFile,
    downloadReceivedFile,
    resetTransfer,
    nextRotationTime,
    notification,
    latency,
    dismissToast
  };
};