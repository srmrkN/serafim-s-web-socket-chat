import React, { useState } from 'react';
import './Register.css';

function Register({ onRegister }) {
    const [nickname, setNickname] = useState('');
    const [isButtonVisible, setIsButtonVisible] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [hasTypedThreeChars, setHasTypedThreeChars] = useState(false);

    const handleRegister = () => {
        if (nickname.trim()) {
            onRegister(nickname);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setNickname(value);

        if (value.length >= 3) {
            setIsButtonVisible(true);
            setHasTypedThreeChars(true);
            setShowWarning(false);
        } else {
            setIsButtonVisible(false);
            if (hasTypedThreeChars) {
                setShowWarning(true);
            }
        }
    };

    return (
        <div className="register">
            <input
                type="text"
                value={nickname}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                className="register-input"
                placeholder="Enter your nickname"
            />
            {showWarning && <p className="warning-text visible">Nickname must contain at least 3 characters</p>}
            <button
                onClick={handleRegister}
                className={`register-button ${isButtonVisible ? 'visible' : ''}`}
            >
                Register
            </button>
        </div>
    );
}

export default Register;