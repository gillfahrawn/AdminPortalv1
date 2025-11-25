import { useState, useEffect } from 'react';

const BirthdateComponent = ({ value, onChange }) => {
  const [birthdate, setBirthdate] = useState(value || '');

  useEffect(() => {
    setBirthdate(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setBirthdate(newValue);
    onChange('birthdate', newValue);
  };

  return (
    <div className="form-group">
      <label htmlFor="birthdate">
        <strong>Date of Birth</strong>
      </label>
      <input
        id="birthdate"
        type="date"
        value={birthdate}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          marginTop: '10px'
        }}
      />
    </div>
  );
};

export default BirthdateComponent;
