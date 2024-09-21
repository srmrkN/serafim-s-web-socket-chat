import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome

const Header = ({ nickname, getConnectionStatus, handleExit }) => (
    <header className="chat-header">
        <span className="user-name">{nickname}</span>
        <span className="connection-status">{getConnectionStatus()}</span>
        <button className="exit-button" onClick={handleExit}>
            <i className="fas fa-sign-out-alt"></i> {/* Font Awesome icon */}
        </button>
    </header>
);

export default Header;