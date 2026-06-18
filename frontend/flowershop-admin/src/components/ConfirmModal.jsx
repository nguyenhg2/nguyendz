//Ô confirm
export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className='modal-backdrop' onClick={onCancel}>
      <div className='modal confirm-modal' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h3>{title || 'Xác nhận'}</h3>
          <button className='modal-close' onClick={onCancel}>X</button>
        </div>
        <div className='modal-body'>
          <p>{message}</p>
        </div>
        <div className='modal-footer'>
          <button className='btn btn-secondary' onClick={onCancel}>Hủy</button>
          <button className='btn btn-primary' onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}
