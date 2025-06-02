import React, { useEffect, useState, useRef } from 'react';
import './cards.css';
import { MdOutlineAddCard } from 'react-icons/md';

function Cards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showMpinPopup, setShowMpinPopup] = useState(false); // State to toggle MPIN popup
    const [mpin, setMpin] = useState(''); // State to store entered MPIN
    const [cardToDelete, setCardToDelete] = useState(null); // Store the card to delete
    const [newCard, setNewCard] = useState({
        cardNumber: ['', '', '', ''], // Array for 4 groups of 4 digits
        cardType: 'Debit', // Default to Debit
        expiryDate: '',
    });
    const [showMaskedBalance, setShowMaskedBalance] = useState(false); // State to toggle balance visibility
    const [currentCardIndex, setCurrentCardIndex] = useState(null); // Track the currently selected card index
    const [showCardDetailsPopup, setShowCardDetailsPopup] = useState(false); // State to toggle card details popup
    const [selectedCard, setSelectedCard] = useState(null); // State to store the selected card details
    const [primaryCardId, setPrimaryCardId] = useState(null); // State to store the primary card ID
    const inputRefs = useRef([]); // Ref array for card number inputs

    useEffect(() => {
        const fetchCards = async () => {
            const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage
            if (!mobile) {
                setError('Mobile number not found. Please log in again.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/profile?mobile=${mobile}`);
                if (!response.ok) throw new Error('Failed to fetch cards');
                const data = await response.json();
                setCards(data.cards || []); // Set the cards from the response
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchCards();
    }, []);

    useEffect(() => {
        const fetchPrimaryCard = async () => {
            const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage

            try {
                const response = await fetch(`http://localhost:5000/api/get-primary-card?mobile=${mobile}`);
                if (!response.ok) throw new Error('Failed to fetch primary card');
                const data = await response.json();

                setPrimaryCardId(data.primaryCard.cardNumber); // Store the primary card number
            } catch (err) {
                console.error('Error fetching primary card:', err);
            }
        };

        fetchPrimaryCard();
    }, []);

    const handleDeleteCard = async () => {
        const mobile = localStorage.getItem('mobile');
        try {
            const response = await fetch('http://localhost:5000/api/delete-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, cardNumber: cardToDelete }),
            });

            if (!response.ok) throw new Error('Failed to delete card');
            const data = await response.json();
            setCards(data.cards); // Update the cards list after deletion
            alert('Card deleted successfully!');
            setShowMpinPopup(false); // Close the MPIN popup
        } catch (err) {
            console.error('Error deleting card:', err);
            alert('Failed to delete card. Please try again.');
        }
    };

    const validateMpin = async (mpin) => {
        const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage

        try {
            const response = await fetch('http://localhost:5000/api/validate-mpin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, mpin }),
            });

            const data = await response.json();

            if (response.status === 200) {
                return { success: true, message: 'MPIN validated successfully!' };
            } else {
                return { success: false, message: data.message || 'Invalid MPIN' };
            }
        } catch (err) {
            console.error('Error validating MPIN:', err);
            return { success: false, message: 'An error occurred while validating MPIN. Please try again.' };
        }
    };

    const handleMpinSubmit = async () => {
        const result = await validateMpin(mpin); // Use the reusable MPIN validation function

        if (result.success) {
            alert(result.message);

            // Proceed to remove the card if MPIN is correct
            await handleRemoveCard(cardToDelete);

            setMpin(''); // Clear the MPIN input
            setShowMpinPopup(false); // Close the popup
        } else {
            alert(result.message); // Show error message from the backend
            setMpin(''); // Clear the MPIN input but keep the popup open
        }
    };

    const handleCardNumberChange = (value, index) => {
        // Allow only numeric input
        const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters

        const updatedCardNumber = [...newCard.cardNumber];
        updatedCardNumber[index] = numericValue.slice(0, 4); // Limit each box to 4 digits
        setNewCard({ ...newCard, cardNumber: updatedCardNumber });

        // Automatically move to the next input box
        if (numericValue.length === 4 && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();

        // Validate Expiry Date
        const today = new Date();
        const expiryDate = new Date(newCard.expiryDate);
        if (expiryDate <= today) {
            alert('Expiry Date must be greater than today.');
            return;
        }

        const mobile = localStorage.getItem('mobile');
        if (!mobile) {
            alert('Mobile number not found. Please log in again.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/add-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile,
                    card: {
                        cardNumber: newCard.cardNumber.join(''), // Combine the 4 groups into a single string
                        cardType: newCard.cardType,
                        expiryDate: newCard.expiryDate,
                    },
                }),
            });

            if (!response.ok) throw new Error('Failed to add card');
            const data = await response.json();
            setCards(data.cards); // Update the cards list
            setShowForm(false); // Close the form
            setNewCard({ cardNumber: ['', '', '', ''], cardType: 'Debit', expiryDate: '' }); // Reset the form
            alert('Card added successfully!');
        } catch (err) {
            console.error('Error adding card:', err);
            alert('Failed to add card. Please try again.');
        }
    };

    const handleMpinBoxChange = (value, index) => {
        // Allow only numeric input
        if (!/^\d?$/.test(value)) return;

        const updatedMpin = [...mpin];
        updatedMpin[index] = value; // Update the value of the current box
        setMpin(updatedMpin.join('')); // Update the MPIN state

        // Automatically move to the next box if a digit is entered
        if (value && index < 5) {
            document.querySelectorAll('.mpin-box')[index + 1].focus();
        }
    };

    const handleMpinKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !mpin[index] && index > 0) {
            // Move to the previous box if Backspace is pressed and the current box is empty
            document.querySelectorAll('.mpin-box')[index - 1].focus();
        }
    };

    const handleCardClick = async (card) => {
        const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage

        try {
            const response = await fetch(`http://localhost:5000/api/get-card-details?mobile=${mobile}&cardNumber=${card.cardNumber}`);
            if (!response.ok) throw new Error('Failed to fetch card details');
            const data = await response.json();

            setSelectedCard(data); // Store the fetched card details
            setShowMpinPopup(true); // Show the MPIN popup
        } catch (err) {
            console.error('Error fetching card details:', err);
            alert('Failed to fetch card details. Please try again.');
        }
    };

    const handleViewCardDetails = async () => {
        const result = await validateMpin(mpin); // Validate the MPIN

        if (result.success) {
            alert(result.message);
            setShowMpinPopup(false); // Close the MPIN popup
            setMpin(''); // Clear the MPIN input
            setShowCardDetailsPopup(true); // Show the card details popup
        } else {
            alert(result.message); // Show error message
            setMpin(''); // Clear the MPIN input but keep the popup open
        }
    };

    const handleRemoveCard = async (cardNumber) => {
        const mobile = localStorage.getItem('mobile');

        if (!window.confirm('Are you sure you want to remove this card?')) return;

        try {
            const response = await fetch('http://localhost:5000/api/remove-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, cardNumber }),
            });

            if (!response.ok) throw new Error('Failed to remove card');
            const data = await response.json();
            setCards(data.cards); // Update the cards list after removal
            alert('Card removed successfully!');
            setShowCardDetailsPopup(false); // Close the card details popup
        } catch (err) {
            console.error('Error removing card:', err);
            alert('Failed to remove card. Please try again.');
        }
    };

    const handleSetPrimaryCard = async (cardNumber) => {
        const mobile = localStorage.getItem('mobile'); // Get the mobile number from local storage

        try {
            const response = await fetch('http://localhost:5000/api/set-primary-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, cardNumber }),
            });

            if (!response.ok) throw new Error('Failed to set primary card');
            const data = await response.json();

            // Update the cards list to reflect the new primary card
            setCards(data.cards);

            // Update the primaryCardId state
            setPrimaryCardId(cardNumber);

            alert('Card set as primary successfully!');
        } catch (err) {
            console.error('Error setting primary card:', err);
            alert('Failed to set primary card. Please try again.');
        }
    };

    if (loading) return <div className="cards-container">Loading...</div>;
    if (error) return <div className="cards-container">Error: {error}</div>;

    return (
        <div className="cards-container-new">
            <div className="cards-head-new">
                <h1 className="cards-title-new">My Cards</h1>
                <button className="add-card-btn" onClick={() => setShowForm(true)}>
                    <MdOutlineAddCard />
                </button>
            </div>
            {cards.length === 0 ? (
                <p className="no-cards-message-new">No cards available. Add a card to get started.</p>
            ) : (
                <div className="cards-list-new">
                    {cards.map((card, index) => (
                        <div key={index} className="card-item-new" onClick={() => handleCardClick(card)}>
                            <div className="card-header-new">
                                <p className="card-number-new">
                                    <strong>Card Number :</strong> {card.cardNumber.replace(/^(\d{4})\d{8}(\d{4})$/, '$1 **** **** $2')}
                                </p>
                            </div>
                            <div className="card-body-new">
                                <p><strong>Card Type :</strong> {card.cardType}</p>
                                <p><strong>Expiry Date :</strong> {card.expiryDate}</p>
                                <p><strong>Balance :</strong> ₹ ******</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Card Form */}
            {showForm && (
                <div className="add-card-form">
                    <form onSubmit={handleAddCard}>
                        <h2>Add New Card</h2>
                        <label>
                            Card Number:
                            <div className="card-number-input">
                                {newCard.cardNumber.map((group, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        value={group}
                                        onChange={(e) => handleCardNumberChange(e.target.value, index)}
                                        maxLength="4" // Limit each box to 4 digits
                                        ref={(el) => (inputRefs.current[index] = el)} // Assign ref to each input
                                        required
                                        className="card-number-box"
                                    />
                                ))}
                            </div>
                        </label>
                        <label>
                            Card Type:
                            <div className="card-type-options">
                                <label>
                                    <input
                                        type="radio"
                                        name="cardType"
                                        value="Debit"
                                        checked={newCard.cardType === 'Debit'}
                                        onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                                    />
                                    Debit
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="cardType"
                                        value="Credit"
                                        checked={newCard.cardType === 'Credit'}
                                        onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                                    />
                                    Credit
                                </label>
                            </div>
                        </label>
                        <label>
                            Expiry Date:
                            <input
                                type="month" // Use month input for classical date picker
                                value={newCard.expiryDate}
                                onChange={(e) => setNewCard({ ...newCard, expiryDate: e.target.value })}
                                required
                            />
                        </label>
                        <button type="submit" className="submit-card-btn">Add Card</button>
                        <button type="button" className="cancel-card-btn" onClick={() => setShowForm(false)}>Cancel</button>
                    </form>
                </div>
            )}

            {/* MPIN Popup */}
            {showMpinPopup && (
                <div className="mpin-popup">
                    <h2>Enter MPIN</h2>
                    <div className="mpin-input-container">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <input
                                key={index}
                                type="password"
                                inputMode="numeric"
                                maxLength="1"
                                value={mpin[index] || ''}
                                onChange={(e) => handleMpinBoxChange(e.target.value, index)}
                                onKeyDown={(e) => handleMpinKeyDown(e, index)}
                                className="mpin-box"
                            />
                        ))}
                    </div>
                    <button onClick={handleViewCardDetails}>Submit</button>
                    <button onClick={() => setShowMpinPopup(false)}>Cancel</button>
                </div>
            )}

            {/* Card Details Popup */}
            {showCardDetailsPopup && selectedCard && (
                <div className="card-details-popup-securepay">
                    <div className="popup-content-securepay">
                        <h2>Card Details</h2>
                        <p><strong>Card User Name:</strong> {selectedCard.userName || 'N/A'}</p>
                        <p><strong>Card Number:</strong> {selectedCard.cardNumber}</p>
                        <p><strong>Card Type:</strong> {selectedCard.cardType}</p>
                        <p><strong>Expiry Date:</strong> {selectedCard.expiryDate}</p>
                        <p><strong>Balance:</strong> ₹ {selectedCard.balance || '0.00'}</p>
                        <p><strong>Customer ID:</strong> {selectedCard.customerId || 'N/A'}</p>
                        <button
                            className="primary-card-btn"
                            onClick={() => handleSetPrimaryCard(selectedCard.cardNumber)}
                            disabled={selectedCard.cardNumber === primaryCardId} // Disable if it's already the primary card
                        >
                            {selectedCard.cardNumber === primaryCardId ? 'Selected as Primary Account' : 'Set as Primary Account'}
                        </button>
                        <div className="popup-actions">
                            <button
                                className="delete-account-btn"
                                onClick={() => handleRemoveCard(selectedCard.cardNumber)}
                            >
                                Remove Card
                            </button>
                            <button
                                className="close-popup-btn"
                                onClick={() => setShowCardDetailsPopup(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cards;
