// pages/flashcards.js
import React from 'react';
import Sidebar from '../components/Sidebar';
import './flashcards.css';

export default function Flashcards() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="flashcards-content">
        <div className="flashcards-header">
          <h1>My Flashcards</h1>
          <button className="generate-btn">+ Generate New</button>
        </div>

        <div className="flashcard-grid">
          <div className="flashcard">
            <h3>World War II</h3>
            <p>12 cards</p>
            <button>Review</button>
          </div>
          <div className="flashcard">
            <h3>Cell Biology</h3>
            <p>20 cards</p>
            <button>Review</button>
          </div>
          <div className="flashcard">
            <h3>Trigonometry</h3>
            <p>10 cards</p>
            <button>Review</button>
          </div>
          <div className="flashcard">
            <h3>French Revolution</h3>
            <p>15 cards</p>
            <button>Review</button>
          </div>
        </div>
      </main>
    </div>
  );
}

