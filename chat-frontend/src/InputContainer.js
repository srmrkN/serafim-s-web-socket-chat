import React from 'react';

const InputContainer = ({ message, setMessage, handleSendMessage, handleKeyPress }) => {
    const handleKeyPressWithValidation = (event) => {
        if (event.key === 'Enter' && message.trim()) {
            handleSendMessage();
        }
    };

    return (
        <div className="input-container">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPressWithValidation}
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
    );
};

export default InputContainer;