import React, { useState, useEffect, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import './App.css';
import Register from './Register';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome

const generateClientId = () => Math.floor(Math.random() * 10000);

function App() {
    const [clientId, setClientId] = useState(() => {
        const savedClientId = sessionStorage.getItem('clientId');
        return savedClientId ? parseInt(savedClientId, 10) : null;
    });
    const [nickname, setNickname] = useState(() => {
        const savedNickname = sessionStorage.getItem('nickname');
        return savedNickname || '';
    });
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [errorMessage, setErrorMessage] = useState(''); // State for error message
    const chatWindowRef = useRef(null);

    useEffect(() => {
        if (clientId) {
            sessionStorage.setItem('clientId', clientId);
        }
    }, [clientId]);

    useEffect(() => {
        if (nickname) {
            sessionStorage.setItem('nickname', nickname);
        }
    }, [nickname]);

    const SOCKET_URL = clientId && nickname ? `ws://localhost:8000/ws/${clientId}/${nickname}` : null;

    const { sendMessage, lastMessage, readyState } = useWebSocket(SOCKET_URL, {
        onOpen: () => console.log(`Connected to WebSocket as client #${clientId}`),
        onMessage: (event) => {
            console.log(`Received message: ${event.data}`);
            try {
                const parsedMessage = JSON.parse(event.data);
                const { username, type, message } = parsedMessage;

                if (type === 'chat') {
                    setChat((prev) => [...prev, `${username}: ${message}`]);
                } else if (type === 'system') {
                    setChat((prev) => [...prev, `SYSTEM: ${message}`]);
                } else if (type === 'join') {
                    setChat((prev) => [...prev, `SYSTEM: ${username} has joined the chat`]);
                } else if (type === 'leave') {
                    setChat((prev) => [...prev, `SYSTEM: ${username} has left the chat`]);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        },
        onClose: () => console.log('Disconnected from WebSocket'),
        shouldReconnect: () => true,
    });

    const getConnectionStatus = () => {
        console.log(SOCKET_URL);
        switch (readyState) {
            case WebSocket.CONNECTING:
                return 'Connecting...';
            case WebSocket.OPEN:
                return 'Connection is OK';
            case WebSocket.CLOSING:
                return 'Closing connection...';
            case WebSocket.CLOSED:
                return 'WebSocket is not open';
            default:
                return 'Unknown status';
        }
    };

    useEffect(() => {
        if (lastMessage && lastMessage.data === 'close') {
            console.log('Closing WebSocket connection');
            sendMessage(null);
        }
    }, [lastMessage, sendMessage]);

    const handleSendMessage = () => {
        if (readyState === WebSocket.OPEN) {
            const messageObject = {
                username: nickname,
                type: 'chat',
                message: message
            };
            console.log(`Sending message: ${JSON.stringify(messageObject)}`);
            sendMessage(JSON.stringify(messageObject));
            setMessage('');
            setErrorMessage(''); // Clear error message
        } else {
            console.log('WebSocket is not open. Message not sent.');
            setErrorMessage('WebSocket is not open. Message not sent.'); // Set error message
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chat]);

    const handleRegister = (nickname) => {
        console.log(`Registering nickname: ${nickname}`);
        setNickname(nickname);
        setClientId(generateClientId());
    };

    const handleExit = () => {
        console.log('Exiting chat');
        sessionStorage.removeItem('clientId');
        sessionStorage.removeItem('nickname');
        setClientId(null);
        setNickname('');
        // Close the WebSocket connection
        if (sendMessage) {
            sendMessage('close');
        }
    };

    if (!nickname) {
        return <Register onRegister={handleRegister} />;
    }

    return (
        <div className="App">
            <header className="chat-header">
                <span className="user-name">{nickname}</span>
                <span className="connection-status">{getConnectionStatus()}</span>
                <button className="exit-button" onClick={handleExit}>
                    <i className="fas fa-sign-out-alt"></i> {/* Font Awesome icon */}
                </button>
            </header>
            <h1>WebSocket Chat</h1>
            {errorMessage && (
                <>
                    <div className="modal-overlay"></div>
                    <div className="modal">
                        <div className="modal-header">Oops.. We ran into a problem!</div>
                        <div className="modal-content">
                            <p>{errorMessage}</p>
                            <button onClick={() => setErrorMessage('')}>Close</button>
                        </div>
                    </div>
                </>
            )}
            <div className="chat-window">
                <div className="chat-content" ref={chatWindowRef}>
                    {chat.map((msg, index) => {
                        const isSystemMessage = msg.startsWith('SYSTEM: ');
                        const [client, ...messageParts] = msg.split(': ');
                        const message = messageParts.join(': ');
                        const isOwnMessage = client === nickname;

                        return (
                            <div key={index} className={`chat-message ${isSystemMessage ? 'system-message' : isOwnMessage ? 'own-message' : 'other-message'}`}>
                                {!isSystemMessage && !isOwnMessage && <div className="client-name">{client}</div>}
                                <div className="message-content">{message}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="input-container">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="message-input"
                        style={{ flexGrow: message.trim() ? 0.9 : 1 }}
                    />
                    <button
                        onClick={handleSendMessage}
                        className={`send-button ${message.trim() ? 'visible' : 'hidden'}`}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;