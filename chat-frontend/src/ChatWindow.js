import React, { useRef, useEffect } from 'react';

const ChatWindow = ({ chat, nickname }) => {
    const chatWindowRef = useRef(null);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chat]);

    return (
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
        </div>
    );
};

export default ChatWindow;