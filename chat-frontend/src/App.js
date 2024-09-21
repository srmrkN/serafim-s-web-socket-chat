import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import './App.css';
import Register from './Register';
import Header from './Header';
import ChatWindow from './ChatWindow';
import InputContainer from './InputContainer';

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
    const [errorMessage, setErrorMessage] = useState('');

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
        if (readyState === WebSocket.OPEN && message.trim()) {
            const messageObject = {
                username: nickname,
                type: 'chat',
                message: message
            };
            console.log(`Sending message: ${JSON.stringify(messageObject)}`);
            sendMessage(JSON.stringify(messageObject));
            setMessage('');
            setErrorMessage('');
        } else {
            console.log('WebSocket is not open. Message not sent.');
            setErrorMessage('WebSocket is not open. Message not sent.');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && message.trim()) {
            handleSendMessage();
        }
    };

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
        if (sendMessage) {
            sendMessage('close');
        }
    };

    if (!nickname) {
        return <Register onRegister={handleRegister} />;
    }

    return (
        <div className="App">
            <Header nickname={nickname} getConnectionStatus={getConnectionStatus} handleExit={handleExit} />
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
            <div className="chat-container">
                <ChatWindow chat={chat} nickname={nickname} />
                <InputContainer
                    message={message}
                    setMessage={setMessage}
                    handleSendMessage={handleSendMessage}
                    handleKeyPress={handleKeyPress}
                />
            </div>
        </div>
    );
}

export default App;