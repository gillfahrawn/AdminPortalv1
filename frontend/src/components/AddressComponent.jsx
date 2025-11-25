import { useState, useEffect } from 'react';

const AddressComponent = ({ values, onChange }) => {
  const [address, setAddress] = useState({
    street_address: values?.street_address || '',
    city: values?.city || '',
    state: values?.state || '',
    zip: values?.zip || ''
  });

  useEffect(() => {
    setAddress({
      street_address: values?.street_address || '',
      city: values?.city || '',
      state: values?.state || '',
      zip: values?.zip || ''
    });
  }, [values]);

  const handleChange = (field, value) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    onChange(field, value);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginBottom: '15px'
  };

  return (
    <div className="form-group">
      <label>
        <strong>Address</strong>
      </label>

      <div style={{ marginTop: '10px' }}>
        <label htmlFor="street-address" style={{ display: 'block', marginBottom: '5px' }}>
          Street Address
        </label>
        <input
          id="street-address"
          type="text"
          value={address.street_address}
          onChange={(e) => handleChange('street_address', e.target.value)}
          placeholder="123 Main St"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="city" style={{ display: 'block', marginBottom: '5px' }}>
          City
        </label>
        <input
          id="city"
          type="text"
          value={address.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="San Francisco"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="state" style={{ display: 'block', marginBottom: '5px' }}>
          State
        </label>
        <input
          id="state"
          type="text"
          value={address.state}
          onChange={(e) => handleChange('state', e.target.value)}
          placeholder="CA"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="zip" style={{ display: 'block', marginBottom: '5px' }}>
          ZIP Code
        </label>
        <input
          id="zip"
          type="text"
          value={address.zip}
          onChange={(e) => handleChange('zip', e.target.value)}
          placeholder="94102"
          style={inputStyle}
        />
      </div>
    </div>
  );
};

export default AddressComponent;
