// components/DeletePlanModal.jsx
import React from 'react';
import '../assets/styles/DeleteModal.css';

export const DeletePlanModal = ({ isOpen, onClose, onConfirm, planName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <h2 className="modal-title">Confirm Delete plan ?</h2>
          <p className="modal-message">
            Are you sure ? Do want to delete this plan?
          </p>
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-delete" onClick={onConfirm}>
              Delete plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};